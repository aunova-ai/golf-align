import {
  Camera,
  Check,
  FileImage,
  Play
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

export function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      <p>{desc}</p>
    </header>
  );
}

export function Section({
  title,
  action,
  onAction,
  children
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-title">
        <h2>{title}</h2>
        {action ? <button onClick={onAction}>{action}</button> : null}
      </div>
      {children}
    </section>
  );
}

export function Card({
  children,
  tone,
  className = ""
}: {
  children: ReactNode;
  tone?: "soft";
  className?: string;
}) {
  return <article className={`card ${tone === "soft" ? "soft" : ""} ${className}`}>{children}</article>;
}

export function ActionButton({
  children,
  variant = "primary",
  wide = true,
  onClick
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  wide?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`${variant} ${wide ? "wide" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="chips">{children}</div>
    </div>
  );
}

export function Chip({
  children,
  active,
  onClick
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`chip ${active ? "active" : ""}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export function Badge({ children, tone = "amber" }: { children: ReactNode; tone?: "amber" | "green" | "gray" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Avatar({ imageUrl, label }: { imageUrl?: string; label: string }) {
  return (
    <div className="avatar">
      {imageUrl ? <img src={imageUrl} alt={`${label} 프로필`} /> : label}
    </div>
  );
}

export function ProfileTile({ imageUrl, name }: { imageUrl?: string; name: string }) {
  return (
    <div className="profile-tile">
      <div className="profile-photo">
        {imageUrl ? <img src={imageUrl} alt={`${name} 프로필`} /> : <span>{name.slice(0, 1)}</span>}
      </div>
      <span>{name}</span>
    </div>
  );
}

export function Person({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div className="person">
      <div className={`mini-profile ${muted ? "muted" : ""}`}>{label}</div>
      <span>{label}</span>
    </div>
  );
}

export function TrainingRow({
  title,
  meta,
  status,
  onToggle
}: {
  title: string;
  meta: string;
  status?: string;
  onToggle?: () => void;
}) {
  const isDone = status === "완료" || Boolean(status?.includes("완료"));
  const content = (
    <>
      <div className={`check-dot ${isDone ? "checked" : ""}`} aria-hidden="true">{isDone ? <Check size={16} /> : null}</div>
      <div>
        <h3>{title}</h3>
        <p>{meta}</p>
      </div>
      {status ? <Badge>{status}</Badge> : null}
    </>
  );

  if (onToggle) {
    return (
      <button
        className={`training-row training-row-button ${isDone ? "is-done" : ""}`}
        type="button"
        aria-pressed={isDone}
        onClick={onToggle}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="training-row">
      {content}
    </div>
  );
}

export function RecordCard({
  title,
  meta,
  media,
  thumbnailUrl,
  badge,
  cta = "스냅샷 보기",
  onClick
}: {
  title: string;
  meta: string;
  media: "video" | "image";
  thumbnailUrl?: string;
  badge?: string;
  cta?: string;
  onClick: () => void;
}) {
  const actionLabel = `${cta}: ${title}`;

  return (
    <button aria-label={actionLabel} className="record-card" onClick={onClick}>
      <div className="record-media">
        {thumbnailUrl ? <img src={thumbnailUrl} alt={`${title} 썸네일`} /> : media === "video" ? <Play size={26} /> : <FileImage size={26} />}
      </div>
      <div className="record-card-body">
        <div className="record-badges">
          {badge ? <Badge tone={badge.includes("피드백") || badge.includes("공유") ? "green" : "amber"}>{badge}</Badge> : null}
          <Badge tone="gray">{media === "video" ? "영상" : "이미지"}</Badge>
        </div>
        <h3>{title}</h3>
        <p>{meta}</p>
        <span className="record-cta">{cta}</span>
      </div>
    </button>
  );
}

export function RecordListItem({
  title,
  meta,
  badge,
  thumbnailUrl,
  cta = "스냅샷 보기",
  onClick
}: {
  title: string;
  meta: string;
  badge: string;
  thumbnailUrl?: string;
  cta?: string;
  onClick: () => void;
}) {
  const actionLabel = `${cta}: ${title}`;

  return (
    <button aria-label={actionLabel} className="list-item" onClick={onClick}>
      <div className="thumb">
        {thumbnailUrl ? <img src={thumbnailUrl} alt={`${title} 썸네일`} /> : <Camera size={20} />}
      </div>
      <div>
        <div className="record-badges">
          <Badge tone={badge.includes("피드백") || badge.includes("공유") || badge.includes("확인") ? "green" : "amber"}>{badge}</Badge>
        </div>
        <h3>{title}</h3>
        <p>{meta}</p>
        <span className="record-cta">{cta}</span>
      </div>
    </button>
  );
}

export function MemberListItem({
  imageUrl,
  name,
  meta,
  onClick
}: {
  imageUrl?: string;
  name: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button aria-label={`${name} 회원 보기`} className="list-item" onClick={onClick}>
      <Avatar imageUrl={imageUrl} label={name.slice(0, 1)} />
      <div>
        <h3>{name}</h3>
        <p>{meta}</p>
      </div>
    </button>
  );
}

export function RoundTeaser() {
  return (
    <section className="section">
      <article className="round-card">
        <Badge tone="gray">개발 중</Badge>
        <h2>라운드 모집</h2>
        <p>함께 라운드할 멤버를 찾는 기능이 준비 중입니다.</p>
        <div className="avatars">
          <Avatar label="김" />
          <Avatar label="박" />
          <Avatar label="+" />
          <Avatar label="+" />
        </div>
      </article>
    </section>
  );
}

export function Sticker({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <span className="sticker" style={style}>
      {children}
    </span>
  );
}

export function MediaViewer({ children }: { children?: ReactNode }) {
  return (
    <div className="viewer">
      <div className="pose-line" />
      {children}
      <Play className="viewer-play" size={34} />
    </div>
  );
}

export function Toggle({ label }: { label: string }) {
  return (
    <div className="toggle">
      <span>{label}</span>
      <span className="switch" />
    </div>
  );
}

export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function NavButton({
  icon,
  label,
  active,
  onClick
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
