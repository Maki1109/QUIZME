/**
 * Renders one question (image and/or text) and the answer control for its type:
 *   MCQ          A–D
 *   TrueFalse    Đúng / Sai for statements a–d → "D S - S"
 *   ShortAnswer  numeric text field
 */

import { useRef, useState } from 'react';
import { Check, X, ZoomIn } from 'lucide-react';
import type { Question } from '../lib/types';
import { Pill } from './ui';
import { MathText } from './math';

export function QuestionBody({ question, number }: { question: Question; number?: number }) {
  const [zoom, setZoom] = useState(false);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {number !== undefined && <span className="display text-2xl normal-case">Câu {number}</span>}
        <Pill tone="sky">{question.typeName}</Pill>
        <Pill tone="lavender">{question.topicName}</Pill>
        <Pill tone="paper-2">{question.levelName}</Pill>
      </div>
      {question.content && <MathText text={question.content} className="block whitespace-pre-line text-lg leading-relaxed text-ink" />}
      {question.imageUrl && (
        <>
          <button type="button" onClick={() => setZoom(true)} className="group relative mt-3 flex min-h-24 w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-white" aria-label="Phóng to đề bài">
            <img src={question.imageUrl} alt={`Đề bài ${question.code}`} decoding="async" referrerPolicy="no-referrer" className="mx-auto max-h-[60vh] w-auto max-w-full object-contain" />
            <span className="absolute right-3 top-3 hidden rounded-full bg-ink/80 p-2 text-paper group-hover:block">
              <ZoomIn className="h-4 w-4" />
            </span>
          </button>
          {zoom && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-4" onClick={() => setZoom(false)} role="dialog" aria-modal="true" aria-label="Đề bài phóng to">
              <img src={question.imageUrl} alt={`Đề bài ${question.code}`} referrerPolicy="no-referrer" className="max-h-full max-w-full rounded-xl bg-white" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const LETTERS = ['A', 'B', 'C', 'D'];
const STATEMENTS = ['a', 'b', 'c', 'd'];

export const tfTokens = (value: string) => {
  const parts = (value || '').trim().split(/\s+/);
  return STATEMENTS.map((_, i) => (parts[i] === 'D' || parts[i] === 'Đ' ? 'D' : parts[i] === 'S' ? 'S' : '-'));
};

/** Display "D S - S" as "Đ S – S". */
export const prettyAnswer = (type: Question['type'], value: string) => {
  if (!value) return 'Chưa trả lời';
  if (type === 'TrueFalse') return tfTokens(value).map((t, i) => `${STATEMENTS[i]}) ${t === 'D' ? 'Đúng' : t === 'S' ? 'Sai' : '—'}`).join('  ');
  return value;
};

interface AnswerProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** After grading: the correct key, to colour the options. */
  correct?: string | null;
}

export function AnswerInput({ question, value, onChange, disabled, correct }: AnswerProps) {
  const latest = useRef(value);
  latest.current = value;
  if (question.type === 'TrueFalse') {
    const mine = tfTokens(value);
    const key = correct ? tfTokens(correct.replace(/Đ/g, 'D')) : null;
    const set = (i: number, t: 'D' | 'S') => {
      const next = tfTokens(latest.current);
      next[i] = next[i] === t ? '-' : t;
      latest.current = next.join(' ');
      onChange(latest.current);
    };
    return (
      <div className="space-y-2" role="group" aria-label="Chọn Đúng hoặc Sai cho từng ý">
        {STATEMENTS.map((s, i) => (
          <div key={s} className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-2.5">
            <span className="w-6 font-extrabold">{s})</span>
            <span className="flex-1 text-sm text-ink-2">Ý {s} trong đề</span>
            {(['D', 'S'] as const).map((t) => {
              const chosen = mine[i] === t;
              const isKey = key && key[i] === t;
              const wrongPick = key && chosen && !isKey;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={disabled}
                  onClick={() => set(i, t)}
                  aria-pressed={chosen}
                  className={`min-w-[4.5rem] rounded-full border-2 px-3 py-1.5 text-sm font-extrabold transition-transform active:scale-95 disabled:cursor-default ${
                    isKey ? 'border-[var(--answer-correct)] bg-lime' : wrongPick ? 'border-[var(--answer-wrong)] bg-pink' : chosen ? 'border-ink bg-ink text-paper' : 'border-line bg-surface hover:border-ink'
                  }`}
                >
                  {t === 'D' ? 'Đúng' : 'Sai'}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  if (question.type === 'ShortAnswer') {
    return (
      <div>
        <label htmlFor={`ans-${question.id}`} className="mb-2 block text-sm font-bold">
          Đáp số của bạn
        </label>
        <input
          id={`ans-${question.id}`}
          inputMode="decimal"
          autoComplete="off"
          maxLength={20}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,\-+]/g, ''))}
          placeholder="Ví dụ: 24,5"
          className="h-14 w-full max-w-xs rounded-2xl border-[1.5px] border-line bg-surface px-4 text-xl font-bold tabular-nums outline-none focus:border-ink focus:ring-4 focus:ring-[var(--butter)] disabled:opacity-70"
        />
        {correct && (
          <p className="mt-2 text-sm font-bold">
            Đáp án đúng: <span className="rounded bg-lime px-2 py-0.5">{correct}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Chọn đáp án">
      {LETTERS.map((letter, i) => {
        const chosen = value === letter;
        const isKey = correct === letter;
        const wrongPick = Boolean(correct) && chosen && !isKey;
        return (
          <button
            key={letter}
            type="button"
            role="radio"
            aria-checked={chosen}
            disabled={disabled}
            onClick={() => onChange(chosen ? '' : letter)}
            className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-[transform,border-color,background-color] active:scale-[0.98] disabled:cursor-default ${
              isKey ? 'border-[var(--answer-correct)] bg-lime' : wrongPick ? 'border-[var(--answer-wrong)] bg-pink' : chosen ? 'border-ink bg-ink text-paper' : 'border-line bg-surface hover:border-ink'
            }`}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-extrabold ${chosen && !correct ? 'bg-paper text-ink' : 'bg-paper-2'}`}>
              {isKey ? <Check className="h-4 w-4" /> : wrongPick ? <X className="h-4 w-4" /> : letter}
            </span>
            <span className="font-semibold">{question.options && question.options[i] ? <MathText text={question.options[i]} /> : `Phương án ${letter}`}</span>
          </button>
        );
      })}
    </div>
  );
}
