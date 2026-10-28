"use client";
import {ChevronLeft, ArrowUp} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import s from "./chat.module.css";
import ThinkingIndicator from "./ThinkingIndicator";
import EmergencyAction from "../EmergencyAction";
import {useTabNavigation} from "../TabMotion";
import {useChatTopics} from "../chat-topics";
type Message = { text: string; user: boolean };

export default function ChatPage() {
  const navigate=useTabNavigation();
  const topics=useChatTopics();
  const topicDrag=useRef<{x:number;left:number}|null>(null),topicMoved=useRef(false);
  const [selectedTopic,setSelectedTopic]=useState("");
  const chatRoot=useRef<HTMLElement>(null);
  useEffect(() => {
    // Text inputs match :focus-visible even after a tap; track Tab explicitly.
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Tab") chatRoot.current?.setAttribute("data-keyboard-focus", "true");
    };
    const pointer = () => chatRoot.current?.removeAttribute("data-keyboard-focus");
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("pointerdown", pointer, true);
    return () => {
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("pointerdown", pointer, true);
    };
  }, []);
  useEffect(()=>{const viewport=window.visualViewport;if(!viewport)return;const resize=()=>{if(viewport.scale===1)chatRoot.current?.style.setProperty('--chat-height',`${viewport.height}px`)};resize();viewport.addEventListener('resize',resize);return()=>viewport.removeEventListener('resize',resize)},[]);
  const [returnTo, setReturnTo] = useState("/ruenfai");
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (["/ruenfai", "/ruenfai/appointments", "/ruenfai/medicines", "/ruenfai/journal"].includes(from ?? "")) {
      const timer = setTimeout(() => setReturnTo(from!), 0);
      return () => clearTimeout(timer);
    }
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    { text: "สวัสดีค่ะ วันนี้คุณแม่อยากปรึกษาเรื่องอะไร เล่าให้ฟังได้เลยนะคะ", user: false },
  ]);
  const [draft, setDraft] = useState("");
  useEffect(()=>{const question=new URLSearchParams(window.location.search).get("question");if(question){const timer=setTimeout(()=>(setDraft(question.slice(0,500)),setSelectedTopic(question.slice(0,500))),0);return()=>clearTimeout(timer)}},[]);
  const [replying, setReplying] = useState(false);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (replyTimer.current) clearTimeout(replyTimer.current);
    },
    [],
  );
  function send(text: string, fromSuggestion = false) {
    const trimmed = text.trim();
    if (!trimmed || replyTimer.current) return;
    following.current = true;
    setMessages((previous) => [...previous, { text: trimmed, user: true }]);
    setReplying(true);
    replyTimer.current = setTimeout(() => {
      setMessages((previous) => [
        ...previous,
        { text: "เล่าเพิ่มเติมได้เลยค่ะ คุณแม่อยากให้ช่วยเรื่องไหนเป็นพิเศษคะ", user: false },
      ]);
      setReplying(false);
      replyTimer.current = null;
    }, 3000);
    if (!fromSuggestion) {
      setDraft("");
      input.current?.focus();
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
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${s["ubot-bubble"]} ${message.user ? s["ubot-user"] : ""}`}
          >
            {message.text}
          </div>
        ))}
        {replying && <ThinkingIndicator/>}
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
          {[...new Set([selectedTopic,...topics].filter(Boolean))].map((question) => (
            <button
              key={question}
              type="button"
              disabled={replying}
              onClick={() => send(question,true)}
            >
              {question}
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
              maxLength={2000}
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
