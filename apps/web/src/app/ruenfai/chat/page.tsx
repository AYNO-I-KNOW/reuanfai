"use client";
import {ChevronLeft, ArrowUp} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {Fragment,useEffect,useRef,useState} from "react";
import s from "./chat.module.css";
import EmergencyAction from "../EmergencyAction";
import {routes as tabRoutes,useTabNavigation} from "../TabMotion";
import {allChatTopics,useChatTopics} from "../chat-topics";
type Citation = { sourceId: string; page: number; short?: string | null; apa: string; url: string | null };
type SourceGroup = { sourceId: string; short: string; apa: string; url: string | null; pages: number[] };
// one line per source: pages sorted + deduped; short name falls back to apa
function groupCitations(citations: Citation[]): SourceGroup[] {
  const groups = new Map<string, SourceGroup>();
  for (const cite of citations) {
    const group = groups.get(cite.sourceId) ?? { sourceId: cite.sourceId, short: cite.short || cite.apa, apa: cite.apa, url: cite.url, pages: [] };
    if (!group.pages.includes(cite.page)) group.pages.push(cite.page);
    groups.set(cite.sourceId, group);
  }
  return [...groups.values()].map((group) => ({ ...group, pages: [...group.pages].sort((a, b) => a - b) }));
}
type Message = { text: string; user: boolean; kind?: string; label?: string | null; citations?: Citation[]; suggestions?: string[]; emergency?: boolean };
const BOT_NAME = "ผู้ช่วยส่วนตัว";
const chipsHeading = (message: Message) => (message.kind === "smalltalk" || message.kind === "topic" ? "ลองถามเรื่องเหล่านี้" : "หรือคุณหมายถึง");
const RATE_LIMITED = "ตอนนี้มีคนถามเยอะ ลองใหม่อีกครั้งในอีกสักครู่นะคะ", FAILED = "ขออภัยค่ะ ตอนนี้ตอบคำถามไม่ได้ ลองใหม่อีกครั้งในอีกสักครู่นะคะ";
const ASK_TIMEOUT_MS = 30_000;
// Maps every failure (incl. timeout) to a friendly bot message; only an abort (unmount) is rethrown.
async function ask(question: string, signal: AbortSignal): Promise<Message> {
  try {
    const res = await fetch("/api/kb/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }), signal: AbortSignal.any([signal, AbortSignal.timeout(ASK_TIMEOUT_MS)]) });
    if (res.status === 429) return { text: RATE_LIMITED, user: false };
    const data = res.ok ? await res.json() : null;
    if (typeof data?.answer !== "string") return { text: FAILED, user: false };
    return { text: data.answer, user: false, kind: data.kind, label: data.label, citations: Array.isArray(data.citations) ? data.citations : [], suggestions: Array.isArray(data.suggestions) ? data.suggestions : [], emergency: data.emergency === true };
  } catch (error) {
    if (signal.aborted) throw error;
    return { text: FAILED, user: false };
  }
}

export default function ChatPage() {
  const navigate=useTabNavigation();
  const topics=useChatTopics();
  const topicDrag=useRef<{x:number;left:number}|null>(null),topicMoved=useRef(false);
  const chatRoot=useRef<HTMLElement>(null);
  useEffect(()=>{const viewport=window.visualViewport;if(!viewport)return;const resize=()=>{if(viewport.scale===1)chatRoot.current?.style.setProperty('--chat-height',`${viewport.height}px`)};resize();viewport.addEventListener('resize',resize);return()=>viewport.removeEventListener('resize',resize)},[]);
  const [returnTo, setReturnTo] = useState("/ruenfai");
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (tabRoutes.includes(from ?? "")) {
      const timer = setTimeout(() => setReturnTo(from!), 0);
      return () => clearTimeout(timer);
    }
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    { text: "สวัสดีค่ะ วันนี้คุณแม่อยากปรึกษาเรื่องอะไร เล่าให้ฟังได้เลยนะคะ", user: false },
  ]);
  const [draft, setDraft] = useState("");
  const deepLinkSent=useRef(false);
  // ?question=label from the home bubble: a known chip label sends its mapped query once (timer + ref survive StrictMode's mount→unmount→mount); anything else only fills the draft, never auto-sends
  useEffect(()=>{const timer=setTimeout(()=>{if(deepLinkSent.current)return;const params=new URLSearchParams(window.location.search),question=params.get("question")?.slice(0,500);if(!question)return;deepLinkSent.current=true;params.delete("question");params.delete("query");history.replaceState(history.state,"",`${location.pathname}${params.size?`?${params}`:""}`);const topic=allChatTopics.find(item=>item.label===question);if(topic)send(question,true,topic.query);else setDraft(question)},0);return()=>clearTimeout(timer)},[]);
  const [replying, setReplying] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const following = useRef(true);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!following.current) return;
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [messages, replying]);
  useEffect(
    () => () => {
      pending.current?.abort();
    },
    [],
  );
  // text = shown as the mother's bubble; query = what /api/kb/ask receives (differs for preset chips)
  async function send(text: string, fromSuggestion = false, query = text) {
    const trimmed = text.trim();
    if (!trimmed || pending.current) return;
    following.current = true;
    setMessages((previous) => [...previous, { text: trimmed, user: true }]);
    setReplying(true);
    if (!fromSuggestion) {
      setDraft("");
      input.current?.focus();
    }
    const controller = (pending.current = new AbortController());
    try {
      const reply = await ask(query.trim(), controller.signal);
      setMessages((previous) => [...previous, reply]);
      setReplying(false);
      pending.current = null;
    } catch {
      // aborted on unmount: nothing left to update
    }
  }
  return (
    <main ref={chatRoot} className={s.chat}><div className={s["ubot-chat"]}>
      <header className={s["ubot-header"]}>
        <Link className={s["ubot-back"]} aria-label="ย้อนกลับ" href={returnTo} onClick={event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(returnTo);}}>
          <ChevronLeft size={22} strokeWidth={1.75} />
        </Link>
        <div className={s["ubot-profile"]}>
          <Image width={36} height={36}
            className={s["ubot-avatar"]}
            src="/images/ruenfai/avatar.png"
            alt=""
          />
          <div className={s["ubot-identity"]}>
            <h1>{'ผู้ช่วยส่วนตัว'}</h1>
            <Image className={s["ubot-verified"]} src="/images/ruenfai/chat-verified.svg" width={18} height={18} alt=""/>
          </div>
        </div>
        <EmergencyAction/>
      </header>
      <div
        className={s["ubot-messages"]}
        role="log"
        aria-label={'บทสนทนา'}
        aria-live="polite"
        ref={log}
        onScroll={(event) => {
          const element = event.currentTarget;
          following.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            64;
        }}
      >
        {messages.map((message, index) => {
          const bubble = (
            <div className={`${s["ubot-bubble"]} ${message.user ? s["ubot-user"] : ""}`}>
              {message.text}
            </div>
          );
          if (message.user) return <Fragment key={index}>{bubble}</Fragment>;
          return (
            <div key={index} className={s["ubot-reply"]}>
              <span className={s["ubot-label"]}>{message.label ? `${BOT_NAME} · ${message.label}` : BOT_NAME}</span>
              {bubble}
              {!!message.citations?.length && (
                <ul className={s["ubot-cites"]} aria-label={'ที่มา'}>
                  {groupCitations(message.citations).map((group) => (
                    <li key={group.sourceId}>
                      <details>
                        <summary>
                          {"ที่มา: "}
                          {group.url && /^https?:\/\//.test(group.url) ? <a href={group.url} target="_blank" rel="noopener noreferrer">{group.short}</a> : group.short}
                          {` · หน้า ${group.pages.join(", ")}`}
                        </summary>
                        <span>{group.apa}</span>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
              {(message.kind === "red_flag" || message.emergency) && <EmergencyAction subtle />}
              {!!message.suggestions?.length && (
                <div className={s["ubot-chips"]} role="group" aria-label={chipsHeading(message)}>
                  <span>{chipsHeading(message)}</span>
                  {message.suggestions.map((question) => (
                    <button key={question} type="button" disabled={replying} onClick={() => send(question, true)}>
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {replying && (
          <div
            className={`${s["ubot-bubble"]} ${s["ubot-typing"]}`}
            role="status"
            aria-label={'ผู้ช่วยกำลังพิมพ์'}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </div>
        )}
      </div>
      <footer className={s["ubot-composer"]}>
        <div
          className={s["ubot-quick-prompts"]}
          onPointerDown={event=>{topicMoved.current=false;if(event.pointerType==='mouse')topicDrag.current={x:event.clientX,left:event.currentTarget.scrollLeft}}}
          onPointerMove={event=>{const start=topicDrag.current;if(!start)return;const distance=event.clientX-start.x;if(Math.abs(distance)>6){topicMoved.current=true;event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.scrollLeft=start.left-distance}}}
          onPointerUp={()=>{topicDrag.current=null}}
          onPointerCancel={()=>{topicDrag.current=null}}
          onClickCapture={event=>{if(topicMoved.current){event.preventDefault();event.stopPropagation();topicMoved.current=false}}}
          role="group"
          aria-label={'หัวข้อสนทนา'}
        >
          {topics.map(({label,query}) => (
            <button
              key={label}
              type="button"
              disabled={replying}
              onClick={() => send(label, true, query)}
            >
              {label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <div className={s["ubot-input-wrap"]}>
            <input
              ref={input}
              name="message"
              data-focus-within="true"
              aria-label={'ข้อความ'}
              placeholder={'พิมพ์ข้อความของคุณแม่…'}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoComplete="off"
              maxLength={500}
              enterKeyHint="send"
            />
            <button
              className={s["ubot-send"]}
              aria-label={'ส่งข้อความ'}
              disabled={!draft.trim() || replying}
            >
              <ArrowUp size={22} strokeWidth={1.75} />
            </button>
          </div>
        </form>
      </footer>
    </div></main>
  );
}
