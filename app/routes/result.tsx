import { Link, Navigate, useLocation } from "react-router";
import { RankBadge } from "~/components/RankBadge";
import { isPosition, LANE_LABELS, POSITIONS, type Position } from "~/lib/data";
import {
  isQuestionCount,
  isQuestionTypeId,
  QUESTION_TYPES,
  type QuestionTypeId,
  type QuizSelection,
} from "~/lib/questions";
import { judgeRank } from "~/lib/rank";
import { selectionToSearch } from "~/lib/selection";
import { buildShareText, buildShareUrl } from "~/lib/share";

interface ResultState extends QuizSelection {
  correct: number;
  total: number;
}

function isResultState(state: unknown): state is ResultState {
  if (typeof state !== "object" || state === null) return false;
  const s = state as Record<string, unknown>;
  return (
    Array.isArray(s.lanes) &&
    s.lanes.every(isPosition) &&
    Array.isArray(s.types) &&
    s.types.every(isQuestionTypeId) &&
    (s.count === undefined || isQuestionCount(s.count)) &&
    (s.hard === undefined || typeof s.hard === "boolean") &&
    typeof s.correct === "number" &&
    typeof s.total === "number" &&
    s.total > 0
  );
}

export default function Result() {
  const { state } = useLocation();
  if (!isResultState(state)) return <Navigate to="/" replace />;

  const { lanes, types, count, hard, correct, total } = state;
  const rank = judgeRank(correct, total);
  const pageUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const shareUrl = buildShareUrl(
    buildShareText(lanes, correct, total, rank, hard),
    pageUrl,
  );
  const retrySearch = selectionToSearch({
    lanes: lanes as Position[],
    types: types as QuestionTypeId[],
    count,
    hard,
  });

  const laneText =
    lanes.length >= POSITIONS.length
      ? "すべて"
      : POSITIONS.filter((p) => lanes.includes(p))
          .map((p) => LANE_LABELS[p])
          .join("・");
  const typeText =
    types.length >= QUESTION_TYPES.length
      ? "すべて"
      : QUESTION_TYPES.filter((t) => types.includes(t.id))
          .map((t) => t.label)
          .join("・");
  const conditions: [string, string][] = [
    ["レーン", laneText],
    ["出題タイプ", typeText],
    ["出題数", `${total}問`],
    ["モード", hard ? "ハード" : "通常"],
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-8 px-4 py-12">
      <header className="text-center">
        <h1 className="text-lg font-black text-gold">結果発表</h1>
        <p className="mt-2 text-4xl font-black">
          {correct}
          <span className="text-lg text-gold-light/60"> / {total} 問正解</span>
        </p>
      </header>

      <RankBadge rank={rank} />

      <dl className="w-full max-w-sm rounded-lg border border-gold-dark/40 bg-hextech-black/40 px-4 py-3 text-xs">
        {conditions.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 py-1"
          >
            <dt className="shrink-0 text-gold-light/50">{label}</dt>
            <dd className="text-right leading-relaxed text-gold-light/85">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <a
          href={shareUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-gold px-4 py-3 text-center font-bold text-hextech-black transition-opacity hover:opacity-85"
        >
          𝕏 で結果をシェア
        </a>
        <Link
          to={`/quiz${retrySearch}`}
          className="rounded-lg border border-gold px-4 py-3 text-center font-bold text-gold transition-colors hover:bg-gold/10"
        >
          もう一度挑戦する
        </Link>
        <Link
          to="/"
          className="rounded-lg border border-gold-dark/60 px-4 py-3 text-center text-gold-light/80 transition-colors hover:border-gold"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
