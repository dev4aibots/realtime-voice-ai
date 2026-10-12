import { useEffect, useState } from "react";

/**
 * TextAnimate — word-by-word reveal (pattern after magicuidesign/magicui
 * text-animate, MIT; implemented with pure CSS so no animation library is
 * needed). Used for transcript lines on the lyric sheet: each word fades +
 * rises with a small stagger so streaming speech feels typed-live.
 * Under prefers-reduced-motion it renders plain text (no animation).
 */
type TextAnimateProps = {
  text: string;
  /** stagger between words, seconds */
  stagger?: number;
  className?: string;
  as?: "p" | "span";
};

export function TextAnimate({ text, stagger = 0.035, className = "", as = "p" }: TextAnimateProps) {
  const [reduce, setReduce] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const words = text.split(/(\s+)/);
  const Tag = as === "span" ? "span" : "p";

  if (reduce) return <Tag className={className}>{text}</Tag>;

  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) =>
        /\s+/.test(w) ? (
          <span key={i}>{w}</span>
        ) : (
          <span
            key={i}
            className="word-in"
            style={{ ["--word-delay" as string]: `${(i * stagger).toFixed(3)}s` }}
          >
            {w}
          </span>
        ),
      )}
    </Tag>
  );
}
