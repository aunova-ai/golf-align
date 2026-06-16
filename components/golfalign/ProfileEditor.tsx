"use client";

import { sampleProfileImages } from "@/lib/mock/profileImages";
import { useEffect, useState } from "react";
import type { PrototypeAccount } from "./types";
import { Badge, Card, Field } from "./ui";

type ProfileDraft = {
  bio: string;
  displayName: string;
  golfExperience: string;
  mainGoal: string;
  organization: string;
  phone: string;
  profileImageUrl: string;
};

const profileImageOptions = [
  sampleProfileImages.miSook,
  sampleProfileImages.david,
  sampleProfileImages.sarah,
  sampleProfileImages.kenji,
  sampleProfileImages.fatima,
  sampleProfileImages.liam,
  sampleProfileImages.elena,
  sampleProfileImages.raj,
  sampleProfileImages.chloe,
  sampleProfileImages.ben
];

function createDraft(account: PrototypeAccount): ProfileDraft {
  return {
    bio: account.bio ?? "",
    displayName: account.displayName,
    golfExperience: account.golfExperience ?? "",
    mainGoal: account.mainGoal ?? "",
    organization: account.organization ?? "",
    phone: account.phone ?? "",
    profileImageUrl: account.profileImageUrl ?? profileImageOptions[0]
  };
}

export function ProfileEditor({
  account,
  onSave
}: {
  account: PrototypeAccount | null;
  onSave: (profile: ProfileDraft & { id: string }) => Promise<{ ok: true; account: PrototypeAccount } | { ok: false; message: string }>;
}) {
  const [draft, setDraft] = useState<ProfileDraft | null>(account ? createDraft(account) : null);
  const [notice, setNotice] = useState("");
  const isPro = account?.role === "pro";

  useEffect(() => {
    setDraft(account ? createDraft(account) : null);
    setNotice("");
  }, [account?.id]);

  if (!account || !draft) {
    return null;
  }

  function updateDraft(key: keyof ProfileDraft, value: string) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveProfile() {
    if (!account || !draft) {
      return;
    }

    const result = await onSave({
      ...draft,
      id: account.id
    });
    setNotice(result.ok ? "프로필이 저장됐습니다. 검색 목록에도 반영됩니다." : result.message);
  }

  return (
    <Card className="profile-editor-card">
      <div className="row spread profile-editor-head">
        <div className="profile-editor-title">
          <img src={draft.profileImageUrl} alt={`${draft.displayName} 프로필 미리보기`} />
          <div>
            <Badge tone={isPro ? "amber" : "green"}>{isPro ? "프로 프로필" : "회원 프로필"}</Badge>
            <h3>{draft.displayName || account.displayName}</h3>
            <p>{isPro ? "회원에게 보이는 레슨 정보를 관리합니다." : "프로에게 공유될 기본 정보를 관리합니다."}</p>
          </div>
        </div>
      </div>

      <Field label="프로필 사진">
        <div className="profile-image-picker">
          {profileImageOptions.map((imageUrl) => (
            <button
              className={draft.profileImageUrl === imageUrl ? "active" : ""}
              key={imageUrl}
              onClick={() => updateDraft("profileImageUrl", imageUrl)}
              type="button"
            >
              <img src={imageUrl} alt="프로필 선택" />
            </button>
          ))}
        </div>
      </Field>

      <Field label="표시 이름">
        <input className="input" value={draft.displayName} onChange={(event) => updateDraft("displayName", event.target.value)} />
      </Field>
      <Field label="연락처">
        <input className="input" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} />
      </Field>

      {isPro ? (
        <>
          <Field label="소속/센터">
            <input className="input" value={draft.organization} onChange={(event) => updateDraft("organization", event.target.value)} />
          </Field>
          <label className="field-label">전문 분야/소개</label>
          <textarea className="textarea" value={draft.bio} onChange={(event) => updateDraft("bio", event.target.value)} />
        </>
      ) : (
        <>
          <Field label="골프 경력">
            <input className="input" value={draft.golfExperience} onChange={(event) => updateDraft("golfExperience", event.target.value)} placeholder="예: 6개월, 3년" />
          </Field>
          <Field label="훈련 목표">
            <input className="input" value={draft.mainGoal} onChange={(event) => updateDraft("mainGoal", event.target.value)} placeholder="예: 드라이버 슬라이스 교정" />
          </Field>
        </>
      )}

      {notice ? <p className={notice.includes("저장") ? "save-notice" : "form-error"}>{notice}</p> : null}
      <button className="primary wide" onClick={saveProfile}>
        프로필 저장
      </button>
    </Card>
  );
}
