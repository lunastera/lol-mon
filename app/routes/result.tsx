import { Link, Navigate, useLocation } from "react-router";
import { RankBadge } from "~/components/RankBadge";
import { isPosition, type Position } from "~/lib/data";
import {
  isQuestionTypeId,
  type QuestionTypeId,
  type QuizSelection,
} from "~/lib/questions";
import { judgeRank } from "~/lib/rank";
import { laneLabel, selectionToSearch } from "~/lib/selection";
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
    typeof s.correct === "number" &&
    typeof s.total === "number" &&
    s.total > 0
  );
}

export default function Result() {
  const { state } = useLocation();
  if (!isResultState(state)) return <Navigate to="/" replace />;

  const { lanes, types, correct, total } = state;
  const rank = judgeRank(correct, total);
  const pageUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const shareUrl = buildShareUrl(
    buildShareText(lanes, correct, total, rank),
    pageUrl,
  );
  const retrySearch = selectionToSearch({
    lanes: lanes as Position[],
    types: types as QuestionTypeId[],
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-8 px-4 py-12">
      <header className="text-center">
        <h1 className="text-lg font-black text-gold">
          {laneLabel(lanes) || "総合"}検定 結果発表
        </h1>
        <p className="mt-2 text-4xl font-black">
          {correct}
          <span className="text-lg text-gold-light/60"> / {total} 問正解</span>
        </p>
      </header>

      <RankBadge rank={rank} />

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
