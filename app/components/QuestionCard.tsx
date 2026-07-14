import type { Question } from "~/lib/questions";

/** Wraps the 「term」 portion of the text with a hover tooltip. */
function TextWithTermTooltip({
  text,
  term,
  tooltip,
}: {
  text: string;
  term: string;
  tooltip: string;
}) {
  const marker = `「${term}」`;
  const index = text.indexOf(marker);
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <span className="group/term relative cursor-help underline decoration-dotted decoration-gold/60 underline-offset-4">
        {marker}
        <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 hidden w-72 max-w-[80vw] -translate-x-1/2 rounded-lg border border-gold-dark bg-hextech-black p-2.5 text-left text-xs font-normal leading-relaxed text-gold-light/90 shadow-lg group-hover/term:block">
          {tooltip}
        </span>
      </span>
      {text.slice(index + marker.length)}
    </>
  );
}

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
        <span className="group relative mx-auto mb-4 block w-fit">
          <img
            src={question.imageUrl}
            alt="問題の画像"
            width={96}
            height={96}
            className={`rounded-lg border border-gold-dark ${
              question.imageTooltip ? "cursor-help" : ""
            }`}
          />
          {question.imageTooltip && (
            <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 hidden w-72 max-w-[80vw] -translate-x-1/2 rounded-lg border border-gold-dark bg-hextech-black p-2.5 text-left text-xs font-normal leading-relaxed text-gold-light/90 shadow-lg group-hover:block">
              {question.imageTooltip}
            </span>
          )}
        </span>
      )}
      <p className="text-lg font-bold leading-relaxed">
        {question.termTooltip ? (
          <TextWithTermTooltip
            text={question.text}
            term={question.termTooltip.term}
            tooltip={question.termTooltip.tooltip}
          />
        ) : (
          question.text
        )}
      </p>
      {question.detail && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-deep-blue/40 p-3 text-left text-sm leading-relaxed text-gold-light/75">
          {question.detail}
        </p>
      )}
    </div>
  );
}
