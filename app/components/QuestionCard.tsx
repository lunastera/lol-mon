import type { Question } from "~/lib/questions";

const CATEGORY_LABELS: Record<Question["category"], string> = {
  champion: "チャンピオン",
  item: "アイテム",
  rune: "ルーン・スペル",
};

export function QuestionCard({ question }: { question: Question }) {
  return (
    <div className="rounded-xl border border-gold-dark/60 bg-hextech-black/60 p-5">
      <span className="inline-block rounded-full border border-gold-dark px-2 py-0.5 text-xs text-gold mb-3">
        {CATEGORY_LABELS[question.category]}
      </span>
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="問題の画像"
          width={96}
          height={96}
          className="mx-auto mb-4 rounded-lg border border-gold-dark"
        />
      )}
      <p className="text-lg font-bold leading-relaxed">{question.text}</p>
      {question.detail && (
        <p className="mt-3 rounded-lg bg-deep-blue/40 p-3 text-sm leading-relaxed text-gold-light/75">
          {question.detail}
        </p>
      )}
    </div>
  );
}
