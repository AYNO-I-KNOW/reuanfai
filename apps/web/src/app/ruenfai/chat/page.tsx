"use client";
import {ChevronLeft, ArrowUp, X} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import s from "./chat.module.css";
import shared from "../page.module.css";
import {SolidPhone} from "../SolidIcons";
import {routes as tabRoutes,useTabNavigation} from "../TabMotion";
type Message = { text: string; user: boolean };

export default function ChatPage() {
  const navigate=useTabNavigation();
  const chatRoot=useRef<HTMLElement>(null);
  useEffect(()=>{const viewport=window.visualViewport;if(!viewport)return;const resize=()=>{if(viewport.scale===1)chatRoot.current?.style.setProperty('--chat-height',`${viewport.height}px`)};resize();viewport.addEventListener('resize',resize);return()=>viewport.removeEventListener('resize',resize)},[]);
  const emergencyDialog = useRef<HTMLDialogElement>(null);
  const [emergencyClosing, setEmergencyClosing] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const openEmergency = () => {
    let phone = "";
    try { phone = localStorage.getItem("ruenfai-emergency-phone") ?? ""; } catch {}
    setEmergencyPhone(/^0\d{8,9}$/.test(phone) ? phone : "");
    setEmergencyClosing(false);
    emergencyDialog.current?.showModal();
  };
  const closeEmergency = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { emergencyDialog.current?.close(); return; }
    setEmergencyClosing(true);
  };
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
    }, 1200);
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
        <button type="button" className={s.emergencyTrigger} aria-label="ติดต่อฉุกเฉิน" aria-haspopup="dialog" onClick={openEmergency}><SolidPhone size={22} aria-hidden="true"/></button>
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
          role="group"
          aria-label={'หัวข้อสนทนา'}
        >
          {["การดูแลหลังคลอด", "สอบถามเรื่องยา", "เตรียมตัวไปตามนัด"].map((question) => (
            <button
              key={question}
              type="button"
              disabled={replying}
              onClick={() => send(question, true)}
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
    </div><dialog ref={emergencyDialog} className={shared.medicineDialog} aria-labelledby="chat-emergency-title" onCancel={event=>{event.preventDefault();closeEmergency();}} onClick={event=>{if(event.target===event.currentTarget)closeEmergency();}}><section className={`${shared.medicineSheet} ${shared.emergencySheet} ${emergencyClosing?shared.medicineClosing:""}`} onAnimationEnd={event=>{if(event.target===event.currentTarget&&emergencyClosing){emergencyDialog.current?.close();setEmergencyClosing(false);}}}><header className={shared.medicineSheetHeader}><h2 id="chat-emergency-title">ติดต่อฉุกเฉิน</h2><button type="button" onClick={closeEmergency} aria-label="ปิดช่องทางฉุกเฉิน"><X size={20}/></button></header><div className={shared.medicineSheetBody}><p className={shared.emergencyCopy}>หากต้องการความช่วยเหลือทางการแพทย์ฉุกเฉิน</p><a className={`${shared.emergencyCall} ${s.emergencyPrimary}`} href="tel:1669"><SolidPhone size={20}/>โทร 1669</a>{emergencyPhone&&<a className={shared.emergencyContactCall} href={`tel:${emergencyPhone}`}><SolidPhone size={18}/>โทรหาผู้ติดต่อฉุกเฉิน</a>}</div></section></dialog></main>
  );
}
