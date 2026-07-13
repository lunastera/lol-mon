import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ChoiceButton } from "~/components/ChoiceButton";
import { ProgressBar } from "~/components/ProgressBar";
import { QuestionCard } from "~/components/QuestionCard";
import { loadQuizData } from "~/lib/data";
import { buildQuizSet } from "~/lib/questions";
import { createRng, randomSeed } from "~/lib/random";
import { laneLabel, parseSelection } from "~/lib/selection";
import type { Route } from "./+types/quiz";

export async function clientLoader() {
  return loadQuizData();
}

export default function Quiz({ loaderData: data }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selection = useMemo(() => parseSelection(searchParams), [searchParams]);
  // Keep the seed stable across re-renders so the question set never shifts
  // mid-quiz; a fresh visit gets a fresh seed.
  const [seed] = useState(() => {
    const fromUrl = Number(searchParams.get("seed"));
    return Number.isSafeInteger(fromUrl) && fromUrl > 0
      ? fromUrl
      : randomSeed();
  });
  const questions = useMemo(
    () => buildQuizSet(data, selection, createRng(seed)),
    [data, selection, seed],
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  // Warm the browser cache for every image in the set so later questions
  // render without a visible load.
  useEffect(() => {
    for (const q of questions) {
      for (const url of [q.imageUrl, ...(q.choiceImageUrls ?? [])]) {
        if (url) new Image().src = url;
      }
    }
  }, [questions]);

  if (questions.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 text-center">
        <p>この条件では問題を生成できませんでした。</p>
        <Link to="/" className="mt-4 inline-block text-gold underline">
          トップへ戻る
        </Link>
      </main>
    );
  }

  const question = questions[index];
  const revealed = selected !== null;
  const isLast = index + 1 >= questions.length;
  const title = `${laneLabel(selection.lanes) || "総合"}検定`;

  const choose = (choiceIndex: number) => {
    if (revealed) return;
    setSelected(choiceIndex);
    if (choiceIndex === question.answerIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const next = () => {
    if (isLast) {
      navigate("/result", {
        state: {
          lanes: selection.lanes,
          types: selection.types,
          correct: correctCount,
          total: questions.length,
        },
        replace: true,
      });
      return;
    }
    setIndex(index + 1);
    setSelected(null);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-black text-gold">{title}</h1>
        <Link to="/" className="text-xs text-gold-light/60 hover:text-gold">
          中断してトップへ
        </Link>
      </header>

      <ProgressBar current={index + 1} total={questions.length} />

      <QuestionCard question={question} />

      <div className="flex flex-col gap-2">
        {question.choices.map((choice, i) => (
          <ChoiceButton
            key={choice}
            label={choice}
            iconUrl={question.choiceImageUrls?.[i]}
            tooltip={question.choiceTooltips?.[i]}
            revealed={revealed}
            isAnswer={i === question.answerIndex}
            isSelected={i === selected}
            onClick={() => choose(i)}
          />
        ))}
      </div>

      {revealed && (
        <div className="flex flex-col items-center gap-3">
          <p
            className={`text-lg font-bold ${
              selected === question.answerIndex
                ? "text-hextech-blue"
                : "text-red-400"
            }`}
          >
            {selected === question.answerIndex ? "正解！" : "不正解…"}
          </p>
          <button
            type="button"
            onClick={next}
            className="w-full rounded-lg border border-gold bg-gold/10 px-4 py-3 font-bold text-gold transition-colors hover:bg-gold/20 cursor-pointer"
          >
            {isLast ? "結果を見る" : "次の問題へ"}
          </button>
        </div>
      )}
    </main>
  );
}
