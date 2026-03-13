'use client'

import { useState, useEffect } from 'react';
import { handleDownloadRequest } from './actions';
import {
  MessageCircle, Heart, Download, CheckCircle,
  Mail, Phone, Sparkles, ChevronDown, BookOpen,
  Headphones, FileText, Loader2
} from 'lucide-react';
import { EiffelTower } from '@/components/EiffelTowerIcon';

// ─── Types ───────────────────────────────────────────────────────────────────
type FormStatus = 'idle' | 'loading' | 'error';
type ModalStep = 'form' | 'selecting';

interface AvailableFiles {
  pdf: string | null;
  audioFiles: string[];
  token: string;
}

// ─── Helper : label lisible depuis le nom de fichier ─────────────────────────
function audioLabel(filename: string): string {
  const name = filename.replace(/\.(mp3|m4a|ogg|wav)$/i, '');
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

const CHAPTER_DURATIONS: Record<number, string> = {
  1: '18 min', 2: '22 min', 3: '19 min',
  4: '25 min', 5: '21 min', 6: '17 min', 7: '23 min',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [showModal, setShowModal]       = useState(false);
  const [modalStep, setModalStep]       = useState<ModalStep>('form');
  const [formStatus, setFormStatus]     = useState<FormStatus>('idle');
  const [fileData, setFileData]         = useState<AvailableFiles | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadedFiles, setDownloadedFiles] = useState<Set<string>>(new Set());
  const [scrollY, setScrollY]           = useState(0);
  const [visible, setVisible]           = useState<Set<string>>(new Set());

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setVisible(p => new Set([...p, e.target.id]))),
      { threshold: 0.15 }
    );
    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // ── Soumettre le formulaire ────────────────────────────────────────────────
  async function clientAction(formData: FormData) {
    setFormStatus('loading');
    const result = await handleDownloadRequest(formData);

    if (!result.success || !result.token) {
      setFormStatus('error');
      return;
    }

    // Passe à l'écran de sélection et charge la liste des fichiers
    setModalStep('selecting');
    setLoadingFiles(true);
    setFormStatus('idle');

    try {
      const res  = await fetch(`/api/download?token=${result.token}&list=true`);
      const data = await res.json();
      setFileData({ pdf: data.pdf, audioFiles: data.audioFiles, token: result.token });
    } catch {
      setFormStatus('error');
      setModalStep('form');
    } finally {
      setLoadingFiles(false);
    }
  }

  // ── Télécharger un fichier ─────────────────────────────────────────────────
  async function downloadFile(fileName: string) {
    if (!fileData?.token || downloadingFile) return;
    setDownloadingFile(fileName);
    window.location.href = `/api/download?token=${fileData.token}&file=${encodeURIComponent(fileName)}`;
    await new Promise(r => setTimeout(r, 1400));
    setDownloadingFile(null);
    setDownloadedFiles(prev => new Set([...prev, fileName]));
  }

  // ── Fermer / reset ─────────────────────────────────────────────────────────
  function closeModal() {
    setShowModal(false);
    setTimeout(() => {
      setModalStep('form');
      setFormStatus('idle');
      setFileData(null);
      setDownloadedFiles(new Set());
    }, 300);
  }

  const anim = (id: string) =>
    `section-animate${visible.has(id) ? ' visible' : ''}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lato:wght@300;400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --cream:#F5F0E8; --ink:#1A1A2E; --midnight:#16213E;
          --gold:#C9A84C; --gold-light:#E8CC7A; --blush:#E8D5C4;
          --muted:#7A7065; --accent:#D4836A;
        }
        html { scroll-behavior: smooth; }
        body { font-family:'Lato',sans-serif; background:var(--cream); color:var(--ink); overflow-x:hidden; }

        /* NAV */
        nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:20px 8vw; display:flex; justify-content:space-between; align-items:center; transition:all .4s ease; }
        nav.scrolled { background:rgba(22,33,62,.95); backdrop-filter:blur(12px); padding:14px 8vw; box-shadow:0 4px 30px rgba(0,0,0,.2); }
        .nav-logo { font-family:'Playfair Display',serif; font-size:18px; font-style:italic; color:white; }
        .nav-logo span { color:var(--gold); font-weight:700; }
        .nav-cta { background:var(--gold); color:var(--ink); padding:10px 24px; border-radius:50px; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; cursor:pointer; border:none; font-family:'Lato',sans-serif; transition:all .3s; }
        .nav-cta:hover { background:var(--gold-light); transform:translateY(-1px); }

        /* HERO */
        .hero { min-height:100vh; background:linear-gradient(160deg,var(--midnight) 0%,#0F3460 60%,#1A1A2E 100%); display:grid; grid-template-columns:1fr 1fr; align-items:center; position:relative; overflow:hidden; }
        .hero::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 20% 80%,rgba(201,168,76,.12) 0%,transparent 55%),radial-gradient(ellipse at 80% 20%,rgba(212,131,106,.08) 0%,transparent 50%); pointer-events:none; }
        .particle { position:absolute; border-radius:50%; opacity:.15; animation:float linear infinite; }
        @keyframes float { 0%{transform:translateY(100vh) rotate(0deg);opacity:0} 10%,90%{opacity:.15} 100%{transform:translateY(-100px) rotate(720deg);opacity:0} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        .hero-left { padding:80px 60px 80px 8vw; z-index:2; animation:fadeSlideUp 1s ease both; }
        .hero-tag { display:inline-block; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--gold); border:1px solid rgba(201,168,76,.4); padding:6px 16px; border-radius:20px; margin-bottom:32px; animation:fadeSlideUp 1s .2s ease both; }
        .hero-title { font-family:'Playfair Display',serif; font-size:clamp(48px,6vw,84px); font-weight:900; line-height:1.05; color:white; margin-bottom:8px; animation:fadeSlideUp 1s .3s ease both; }
        .hero-title em { font-style:italic; color:var(--gold-light); }
        .hero-subtitle-line { font-family:'Playfair Display',serif; font-size:clamp(22px,3vw,38px); font-weight:400; font-style:italic; color:rgba(255,255,255,.6); margin-bottom:40px; animation:fadeSlideUp 1s .4s ease both; }
        .hero-desc { font-size:16px; font-weight:300; line-height:1.8; color:rgba(255,255,255,.7); max-width:420px; margin-bottom:48px; animation:fadeSlideUp 1s .5s ease both; }
        .hero-author { display:flex; align-items:center; gap:14px; animation:fadeSlideUp 1s .6s ease both; }
        .hero-author-line { width:40px; height:1px; background:var(--gold); }
        .hero-author-name { font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--gold); }
        .hero-right { display:flex; justify-content:center; align-items:center; padding:60px 8vw 60px 20px; z-index:2; animation:fadeSlideUp 1s .2s ease both; }
        .book-wrapper { position:relative; perspective:1200px; }
        .book-img { width:clamp(200px,28vw,380px); border-radius:4px 16px 16px 4px; box-shadow:-8px 0 0 rgba(0,0,0,.3),-16px 8px 40px rgba(0,0,0,.5),0 30px 80px rgba(0,0,0,.4),0 0 60px rgba(201,168,76,.15); transform:rotateY(-8deg) rotateX(2deg); transition:transform .6s ease; animation:bookEntrance 1.2s .4s ease both; }
        @keyframes bookEntrance { from{opacity:0;transform:rotateY(-25deg) rotateX(5deg) translateY(30px)} to{opacity:1;transform:rotateY(-8deg) rotateX(2deg)} }
        .book-img:hover { transform:rotateY(-3deg) rotateX(1deg) scale(1.02); }
        .book-glow { position:absolute; inset:-20px; background:radial-gradient(ellipse at center,rgba(201,168,76,.2) 0%,transparent 70%); border-radius:50%; pointer-events:none; animation:pulse 3s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        .scroll-hint { position:absolute; bottom:32px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:8px; color:rgba(255,255,255,.3); font-size:11px; letter-spacing:2px; text-transform:uppercase; animation:fadeSlideUp 1s 1.2s ease both; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
        .scroll-arrow { animation:bounce 2s ease-in-out infinite; }

        /* SECTIONS */
        section { padding:100px 8vw; }
        .section-animate { opacity:0; transform:translateY(50px); transition:opacity .8s ease,transform .8s ease; }
        .section-animate.visible { opacity:1; transform:translateY(0); }
        .section-tag { font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--gold); margin-bottom:16px; display:block; }
        .section-title { font-family:'Playfair Display',serif; font-size:clamp(32px,4vw,52px); font-weight:700; line-height:1.2; color:var(--ink); margin-bottom:24px; }

        /* QUOTE */
        .quote-section { background:var(--midnight); padding:80px 8vw; text-align:center; position:relative; overflow:hidden; }
        .quote-section::before { content:'\u201C'; position:absolute; top:-20px; left:50%; transform:translateX(-50%); font-family:'Playfair Display',serif; font-size:300px; color:rgba(201,168,76,.06); line-height:1; pointer-events:none; }
        .quote-text { font-family:'Playfair Display',serif; font-size:clamp(22px,3.5vw,40px); font-style:italic; font-weight:400; color:white; max-width:800px; margin:0 auto 24px; line-height:1.5; position:relative; z-index:1; }
        .quote-author { font-size:13px; letter-spacing:3px; text-transform:uppercase; color:var(--gold); font-weight:700; }

        /* SYNOPSIS */
        .synopsis-section { background:white; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
        .synopsis-text { font-size:16px; font-weight:300; line-height:2; color:var(--muted); }
        .synopsis-text p+p { margin-top:20px; }
        .synopsis-highlights { display:flex; flex-direction:column; gap:24px; }
        .highlight-card { background:var(--cream); border-left:3px solid var(--gold); padding:20px 24px; border-radius:0 12px 12px 0; transition:transform .3s,box-shadow .3s; }
        .highlight-card:hover { transform:translateX(8px); box-shadow:0 8px 30px rgba(0,0,0,.08); }
        .highlight-card h4 { font-family:'Playfair Display',serif; font-size:16px; font-weight:700; color:var(--ink); margin-bottom:6px; display:flex; align-items:center; gap:8px; }
        .highlight-card p { font-size:14px; color:var(--muted); line-height:1.6; font-weight:300; }

        /* AUTHOR */
        .author-section { background:var(--cream); }
        .author-inner { display:grid; grid-template-columns:auto 1fr; gap:60px; align-items:start; max-width:900px; margin:0 auto; }
        .author-avatar { width:120px; height:120px; border-radius:50%; background:linear-gradient(135deg,var(--gold),var(--accent)); display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:42px; color:white; font-weight:700; flex-shrink:0; box-shadow:0 20px 50px rgba(201,168,76,.3); }
        .author-bio { font-size:16px; font-weight:300; line-height:2; color:var(--muted); }

        /* CONTACT */
        .contact-section { background:var(--midnight); text-align:center; }
        .contact-section .section-title { color:white; }
        .section-desc { color:rgba(255,255,255,.5); font-size:15px; font-weight:300; margin-bottom:40px; line-height:1.8; }
        .contact-links { display:flex; justify-content:center; gap:20px; flex-wrap:wrap; }
        .contact-link { display:inline-flex; align-items:center; gap:10px; padding:14px 28px; border:1px solid rgba(201,168,76,.4); border-radius:50px; color:var(--gold); text-decoration:none; font-size:13px; font-weight:700; letter-spacing:1px; transition:all .3s; background:transparent; font-family:'Lato',sans-serif; }
        .contact-link:hover { background:rgba(201,168,76,.1); border-color:var(--gold); transform:translateY(-2px); }

        /* CTA */
        .cta-section { background:linear-gradient(135deg,var(--cream) 0%,var(--blush) 100%); text-align:center; padding:120px 8vw; position:relative; overflow:hidden; }
        .cta-section::before { content:''; position:absolute; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle,rgba(201,168,76,.1) 0%,transparent 70%); top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none; }
        .cta-section .section-title { max-width:600px; margin:0 auto 16px; }
        .cta-desc { font-size:16px; color:var(--muted); font-weight:300; line-height:1.8; max-width:500px; margin:0 auto 48px; }
        .cta-btn { display:inline-flex; align-items:center; gap:12px; background:var(--ink); color:white; padding:18px 48px; border-radius:50px; font-size:15px; font-weight:700; letter-spacing:1px; text-transform:uppercase; cursor:pointer; border:none; font-family:'Lato',sans-serif; transition:all .3s; box-shadow:0 20px 50px rgba(26,26,46,.25); position:relative; z-index:1; }
        .cta-btn:hover { transform:translateY(-3px); box-shadow:0 30px 60px rgba(26,26,46,.35); background:#0F3460; }
        .cta-free-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(201,168,76,.15); border:1px solid rgba(201,168,76,.4); color:#8A6A1E; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:6px 16px; border-radius:20px; margin-top:24px; }

        /* FOOTER */
        footer { background:var(--ink); padding:40px 8vw; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; }
        footer p { font-size:13px; color:rgba(255,255,255,.3); font-weight:300; }
        .footer-title { font-family:'Playfair Display',serif; font-size:18px; font-style:italic; color:var(--gold-light); }

        /* MODAL */
        .modal-overlay { position:fixed; inset:0; background:rgba(22,33,62,.85); backdrop-filter:blur(8px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn .3s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal { background:white; border-radius:24px; padding:48px; max-width:480px; width:100%; position:relative; animation:modalUp .4s cubic-bezier(.34,1.56,.64,1) both; box-shadow:0 40px 100px rgba(0,0,0,.3); max-height:90vh; overflow-y:auto; }
        @keyframes modalUp { from{opacity:0;transform:scale(.85) translateY(40px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .modal-close { position:absolute; top:20px; right:20px; width:36px; height:36px; border-radius:50%; border:1px solid #E5E5E5; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); font-size:18px; transition:all .2s; }
        .modal-close:hover { background:var(--cream); color:var(--ink); }
        .modal-book-mini { display:flex; align-items:center; gap:16px; margin-bottom:28px; padding-bottom:24px; border-bottom:1px solid #F0EDE8; }
        .modal-book-cover { width:52px; height:68px; border-radius:3px 8px 8px 3px; object-fit:cover; box-shadow:-3px 3px 12px rgba(0,0,0,.2); }
        .modal-book-info h3 { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:var(--ink); line-height:1.2; }
        .modal-book-info p { font-size:13px; color:var(--muted); margin-top:4px; }
        .modal h2 { font-family:'Playfair Display',serif; font-size:24px; font-weight:700; color:var(--ink); margin-bottom:8px; }
        .modal-subtitle { font-size:14px; color:var(--muted); margin-bottom:28px; line-height:1.6; font-weight:300; }

        /* FORM */
        .form-group { margin-bottom:20px; }
        .form-group label { display:block; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--ink); margin-bottom:8px; }
        .form-group input { width:100%; padding:14px 18px; border:1.5px solid #E5E0D8; border-radius:12px; font-size:15px; font-family:'Lato',sans-serif; font-weight:300; color:var(--ink); background:var(--cream); outline:none; transition:border-color .2s,box-shadow .2s; }
        .form-group input:focus { border-color:var(--gold); box-shadow:0 0 0 4px rgba(201,168,76,.12); background:white; }
        .form-group input::placeholder { color:#BFB9B0; }
        .submit-btn { width:100%; padding:16px; background:var(--ink); color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; font-family:'Lato',sans-serif; cursor:pointer; transition:all .3s; display:flex; align-items:center; justify-content:center; gap:10px; margin-top:8px; }
        .submit-btn:hover:not(:disabled) { background:#0F3460; transform:translateY(-1px); box-shadow:0 10px 30px rgba(26,26,46,.25); }
        .submit-btn:disabled { opacity:.7; cursor:not-allowed; }
        .error-msg { background:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; padding:12px 16px; font-size:13px; color:#B91C1C; margin-top:12px; text-align:center; }

        /* SELECTION */
        .selection-header { margin-bottom:24px; }
        .selection-header h2 { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:var(--ink); margin-bottom:6px; }
        .selection-header p { font-size:14px; color:var(--muted); font-weight:300; line-height:1.6; }
        .format-tabs { display:flex; gap:6px; margin-bottom:20px; background:var(--cream); border-radius:12px; padding:4px; }
        .format-tab { flex:1; padding:10px 8px; border:none; background:transparent; border-radius:10px; font-size:13px; font-weight:700; font-family:'Lato',sans-serif; color:var(--muted); cursor:pointer; transition:all .25s; display:flex; align-items:center; justify-content:center; gap:6px; white-space:nowrap; }
        .format-tab.active { background:white; color:var(--ink); box-shadow:0 2px 8px rgba(0,0,0,.1); }
        .format-tab:hover:not(.active) { color:var(--ink); }

        /* PDF CARD */
        .pdf-card { background:linear-gradient(135deg,var(--midnight) 0%,#0F3460 100%); border-radius:16px; padding:24px; display:flex; align-items:center; gap:20px; cursor:pointer; transition:all .3s; border:2px solid transparent; }
        .pdf-card:hover { transform:translateY(-2px); box-shadow:0 16px 40px rgba(22,33,62,.3); border-color:var(--gold); }
        .pdf-icon { width:52px; height:52px; background:rgba(255,255,255,.1); border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .pdf-info { flex:1; }
        .pdf-info h4 { font-family:'Playfair Display',serif; font-size:16px; font-weight:700; color:white; margin-bottom:4px; }
        .pdf-info p { font-size:12px; color:rgba(255,255,255,.5); font-weight:300; }
        .pdf-badge { background:var(--gold); color:var(--ink); font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:4px 10px; border-radius:20px; white-space:nowrap; }
        .pdf-badge.done { background:#86EFAC; color:#166534; }

        /* AUDIO LIST */
        .audio-list { display:flex; flex-direction:column; gap:10px; }
        .audio-card { background:var(--cream); border:1.5px solid #E8E2D8; border-radius:14px; padding:16px 20px; display:flex; align-items:center; gap:16px; cursor:pointer; transition:all .25s; }
        .audio-card:hover:not(.busy) { border-color:var(--gold); background:white; transform:translateX(4px); box-shadow:0 6px 20px rgba(0,0,0,.07); }
        .audio-card.downloaded { border-color:#86EFAC; background:#F0FDF4; }
        .audio-card.busy { cursor:not-allowed; opacity:.6; }
        .chapter-num { width:36px; height:36px; border-radius:50%; background:var(--midnight); color:var(--gold); font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-family:'Playfair Display',serif; }
        .audio-card.downloaded .chapter-num { background:#16A34A; color:white; }
        .audio-info { flex:1; min-width:0; }
        .audio-info h4 { font-size:14px; font-weight:700; color:var(--ink); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .audio-info p { font-size:12px; color:var(--muted); font-weight:300; }
        .audio-action { flex-shrink:0; color:var(--muted); transition:color .2s; }
        .audio-card:hover:not(.busy) .audio-action { color:var(--gold); }
        .audio-card.downloaded .audio-action { color:#16A34A; }

        .loading-files { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:40px 0; color:var(--muted); }
        .loading-files p { font-size:14px; font-weight:300; }

        .spin { animation:spin .8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* RESPONSIVE */
        @media (max-width:768px) {
          .hero { grid-template-columns:1fr; padding-top:100px; text-align:center; }
          .hero-left { padding:40px 6vw 0; order:2; }
          .hero-right { padding:60px 6vw 30px; order:1; }
          .hero-desc { margin:0 auto 40px; }
          .hero-author { justify-content:center; }
          .book-img { width:clamp(160px,55vw,260px); }
          .synopsis-section { grid-template-columns:1fr; gap:40px; padding:60px 6vw; }
          .author-inner { grid-template-columns:1fr; text-align:center; }
          .author-avatar { margin:0 auto; }
          section { padding:70px 6vw; }
          .modal { padding:32px 24px; }
          footer { flex-direction:column; text-align:center; }
          .contact-links { flex-direction:column; align-items:center; }
        }
        @media (max-width:480px) {
          .nav-logo { font-size:15px; }
          .modal { padding:24px 18px; border-radius:20px; }
          .format-tab .tab-label { display:none; }
        }
      `}</style>

      {/* NAV */}
      <nav className={scrollY > 50 ? 'scrolled' : ''}>
        <div className="nav-logo">Désolé<span>...</span>ou presque</div>
        <button className="nav-cta" onClick={() => setShowModal(true)}>Télécharger</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="particle" style={{ width:`${4+i*3}px`, height:`${4+i*3}px`, left:`${10+i*12}%`, background: i%2===0 ? '#C9A84C':'#D4836A', animationDuration:`${8+i*2}s`, animationDelay:`${i*1.5}s` }} />
        ))}
        <div className="hero-left">
          <span className="hero-tag">Roman — Édition 2026</span>
          <h1 className="hero-title">Désolé<em>...</em></h1>
          <p className="hero-subtitle-line">... ou presque.</p>
          <p className="hero-desc">Entre les ruelles pavées de Paris et les silences qui en disent trop, une histoire sur les émotions qu'on apprend, trop tard, à apprivoiser.</p>
          <div className="hero-author">
            <div className="hero-author-line" />
            <span className="hero-author-name">Jović Nkili</span>
          </div>
        </div>
        <div className="hero-right">
          <div className="book-wrapper">
            <div className="book-glow" />
            <img src="/book-cover.jpeg" alt="Couverture" className="book-img" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
          </div>
        </div>
        <div className="scroll-hint">
          <span>Découvrir</span>
          <div className="scroll-arrow"><ChevronDown size={24} strokeWidth={1.5} /></div>
        </div>
      </section>

      {/* QUOTE */}
      <div className={`quote-section section-animate${visible.has('quote')?' visible':''}`} id="quote" data-animate>
        <p className="quote-text">"Parfois, les mots les plus difficiles à prononcer sont ceux dont on a le plus besoin."</p>
        <span className="quote-author">— Jović Nkili</span>
      </div>

      {/* SYNOPSIS */}
      <section className={`synopsis-section ${anim('synopsis')}`} id="synopsis" data-animate>
        <div>
          <span className="section-tag">Le roman</span>
          <h2 className="section-title">Une histoire sur les fragiiltés humaines</h2>
          <div className="synopsis-text">
            <p>Dans ce premier roman, Jović Nkili nous plonge dans l'univers parisien d'un jeune homme doté d'une sensibilité humaine rare, qui voit les échecs des autres comme les siens et en culpabilise presque.</p>
            <p>Au fil des pages, c'est un voyage intérieur qui se dessine — entre regrets, rencontres inattendues et la difficile mais libératrice découverte de sa propre vulnérabilité.</p>
            <p>Un roman humain, sincère, et profondément touchant qui dit tout haut ce que les gens vivent en silence.</p>
          </div>
        </div>
        <div className="synopsis-highlights">
          {[
            { Icon: EiffelTower, title:'Paris comme décor vivant', desc:"Les rues, les cafés, la Seine — la ville devient un personnage à part entière dans ce récit." },
            { Icon: MessageCircle, title:'Des dialogues ciselés', desc:"Chaque échange porte le poids des non-dits et révèle la complexité des relations humaines." },
            { Icon: Heart, title:"Une quête d'authenticité", desc:"Un récit sur la vulnérabilité, le courage d'être soi, et la beauté des imperfections." },
          ].map(({ Icon, title, desc }, i) => (
            <div className="highlight-card" key={i} style={{ transitionDelay:`${i*0.1}s` }}>
              <h4><Icon size={20} />{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AUTHOR */}
      <section className={`author-section ${anim('author')}`} id="author" data-animate>
        <span className="section-tag" style={{ textAlign:'center', display:'block' }}>L'auteur</span>
        <h2 className="section-title" style={{ textAlign:'center', marginBottom:'48px' }}>Jović Nkili</h2>
        <div className="author-inner">
          <div className="author-avatar">J</div>
          <div>
            <p className="author-bio">Jović Nkili est un écrivain passionné par les histoires qui résonnent avec la réalité du quotidien. Avec <em>"Désolé… ou presque"</em>, il signe un premier roman sincère et courageux, puisé dans ses propres expériences de vie et d'introspection.</p>
            <p className="author-bio" style={{ marginTop:'16px' }}>Son écriture directe, sans artifice, touche juste. Il croit que la littérature peut changer des vies — une phrase, une page à la fois.</p>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className={`contact-section ${anim('contact')}`} id="contact" data-animate>
        <span className="section-tag">Contact</span>
        <h2 className="section-title">Échangeons et Travaillons Ensemble</h2>
        <p className="section-desc">Une question sur le livre ? Une envie de partager votre ressenti ?<br />Jović est joignable et répond à chaque message avec plaisir.</p>
        <p className="section-desc">Vous avez envie de faire une oeuvre littérature, mais vous avez la flemme de l'écrire ? <br/> Contactez moi. Faites la présentation de votre histoire et je la produirai !!</p>
        <div className="contact-links">
          <a href="mailto:jovicnkili@gmail.com" className="contact-link"><Mail size={16} />Email</a>
          <a href="https://wa.me/237691523389" target="_blank" rel="noreferrer" className="contact-link"><MessageCircle size={16} />WhatsApp</a>
          <a href="tel:+237691523389" className="contact-link"><Phone size={16} />Appeler</a>
        </div>
      </section>

      {/* CTA */}
      <section className={`cta-section ${anim('cta')}`} id="cta" data-animate>
        <span className="section-tag">Lecture & Écoute</span>
        <h2 className="section-title">Prêt à découvrir<br />l'histoire ?</h2>
        <p className="cta-desc">Téléchargez le livre en PDF ou écoutez les chapitres audio. Laissez-vous emporter dans les rues de Paris.</p>
        <button className="cta-btn" onClick={() => setShowModal(true)}>
          <Download size={18} />Télécharger le livre
        </button>
        <div style={{ marginTop:'24px' }}>
          <span className="cta-free-badge"><Sparkles size={14} />Édition 2026 — Accès exclusif</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <span className="footer-title">Désolé… ou presque.</span>
        <p>© 2026 Jović Nkili · Tous droits réservés</p>
      </footer>

      {/* ══════════ MODAL ══════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <button className="modal-close" onClick={closeModal}>✕</button>

            <div className="modal-book-mini">
              <img src="/book-cover.jpeg" alt="Couverture" className="modal-book-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              <div className="modal-book-info">
                <h3>Désolé… ou presque.</h3>
                <p>Jović Nkili · Édition 2026</p>
              </div>
            </div>

            {/* ── ÉTAPE 1 : Formulaire ── */}
            {modalStep === 'form' && (
              <>
                <h2>Obtenez votre accès</h2>
                <p className="modal-subtitle">Renseignez vos informations pour que l'on reste en contact ou alors accéder au livre PDF et aux chapitres audio directement.</p>
                <form action={clientAction}>
                  <div className="form-group">
                    <label>Pseudo</label>
                    <input name="pseudo" type="text" placeholder="Ex : JeanCode" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input name="email" type="email" placeholder="jean@exemple.com" />
                  </div>
                  <button type="submit" className="submit-btn" disabled={formStatus === 'loading'}>
                    {formStatus === 'loading'
                      ? <><Loader2 size={16} className="spin" />Préparation en cours…</>
                      : <><BookOpen size={16} />Accéder aux téléchargements</>
                    }
                  </button>
                  {formStatus === 'error' && (
                    <div className="error-msg">Une erreur est survenue. Veuillez réessayer.</div>
                  )}
                </form>
              </>
            )}

            {/* ── ÉTAPE 2 : Sélection ── */}
            {modalStep === 'selecting' && (
              <>
                <div className="selection-header">
                  <h2>Choisissez votre format</h2>
                  <p>Téléchargez le PDF complet ou sélectionnez un chapitre audio.</p>
                </div>

                {loadingFiles
                  ? (
                    <div className="loading-files">
                      <Loader2 size={28} className="spin" style={{ color:'var(--gold)' }} />
                      <p>Chargement des fichiers disponibles…</p>
                    </div>
                  )
                  : fileData && (
                    <FileSelector
                      fileData={fileData}
                      downloadingFile={downloadingFile}
                      downloadedFiles={downloadedFiles}
                      onDownload={downloadFile}
                    />
                  )
                }
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Composant FileSelector ───────────────────────────────────────────────────
function FileSelector({ fileData, downloadingFile, downloadedFiles, onDownload }: {
  fileData: AvailableFiles;
  downloadingFile: string | null;
  downloadedFiles: Set<string>;
  onDownload: (f: string) => void;
}) {
  const hasPdf   = !!fileData.pdf;
  const hasAudio = fileData.audioFiles.length > 0;
  const [tab, setTab] = useState<'pdf'|'audio'>(hasPdf ? 'pdf' : 'audio');

  return (
    <>
      {/* Tabs — affichés seulement si les deux formats sont dispo */}
      {hasPdf && hasAudio && (
        <div className="format-tabs">
          <button className={`format-tab${tab==='pdf'?' active':''}`} onClick={() => setTab('pdf')}>
            <FileText size={15} />
            <span className="tab-label">Livre PDF</span>
          </button>
          <button className={`format-tab${tab==='audio'?' active':''}`} onClick={() => setTab('audio')}>
            <Headphones size={15} />
            <span className="tab-label">Audio ({fileData.audioFiles.length} chapitres)</span>
          </button>
        </div>
      )}

      {/* ── PDF ── */}
      {tab === 'pdf' && hasPdf && (
        <div
          className="pdf-card"
          onClick={() => !downloadingFile && onDownload(fileData.pdf!)}
          style={{ cursor: downloadingFile ? 'not-allowed' : 'pointer', opacity: downloadingFile && downloadingFile !== fileData.pdf ? .6 : 1 }}
        >
          <div className="pdf-icon">
            {downloadingFile === fileData.pdf
              ? <Loader2 size={22} color="white" className="spin" />
              : downloadedFiles.has(fileData.pdf!)
              ? <CheckCircle size={22} color="#86EFAC" />
              : <FileText size={22} color="white" />
            }
          </div>
          <div className="pdf-info">
            <h4>Livre complet — PDF</h4>
            <p>Tous les chapitres · Format imprimable</p>
          </div>
          <span className={`pdf-badge${downloadedFiles.has(fileData.pdf!) ? ' done' : ''}`}>
            {downloadedFiles.has(fileData.pdf!) ? '✓ Téléchargé' : 'PDF'}
          </span>
        </div>
      )}

      {/* ── AUDIO ── */}
      {tab === 'audio' && hasAudio && (
        <div className="audio-list">
          {fileData.audioFiles.map((file, i) => {
            const isLoading = downloadingFile === file;
            const isDone    = downloadedFiles.has(file);
            const isBusy    = !!downloadingFile && !isLoading;
            return (
              <div
                key={file}
                className={`audio-card${isDone?' downloaded':''}${isBusy?' busy':''}`}
                onClick={() => !downloadingFile && onDownload(file)}
              >
                <div className="chapter-num">
                  {isDone ? <CheckCircle size={16} /> : i + 1}
                </div>
                <div className="audio-info">
                  <h4>{audioLabel(file)}</h4>
                  <p>{CHAPTER_DURATIONS[i+1] ? `~${CHAPTER_DURATIONS[i+1]}` : 'Chapitre audio'}</p>
                </div>
                <div className="audio-action">
                  {isLoading
                    ? <Loader2 size={18} className="spin" />
                    : isDone
                    ? <CheckCircle size={18} color="#16A34A" />
                    : <Download size={18} />
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!hasPdf && !hasAudio && (
        <p style={{ textAlign:'center', color:'var(--muted)', padding:'24px 0', fontSize:'14px' }}>
          Aucun fichier disponible pour le moment.
        </p>
      )}
    </>
  );
}