import { asset } from "@/lib/links";
import "./social-card.css";

/**
 * Fixed-size (1280×640) social / OG card for the React 19.2 handbook.
 *
 * Converted from the former `src/banner/social.html` WeasyPrint template into
 * a component. It is rendered by the `/social-card` route (not linked anywhere
 * in the UI) — screenshot that route at 1280×640 to regenerate the
 * `public/social-card.jpg` Open Graph image.
 */
export default function SocialCard() {
  return (
    <div className="sc" role="img" aria-label="مرجع جامع و حرفه‌ای React 19">
      <div className="sc-grid" aria-hidden="true" />

      <div className="sc-title">
        <div className="sc-kicker">PERSIAN DEVELOPER HANDBOOK</div>
        <div className="sc-h1">
          مرجع جامع و حرفه‌ای{" "}
          <span className="en">
            React <b>19</b>
          </span>
        </div>
        <div className="sc-sub">
          از مبانی تا معماری <b>Production-Level</b> · رایگان و متن‌باز
        </div>
      </div>

      <div className="sc-stats">
        <span>
          <b>۳۷</b>فصل
        </span>
        <span>
          <b>۲۳۹</b>صفحه
        </span>
        <span>
          <b>۸</b>مینی‌پروژه
        </span>
        <span>
          <b>۴۵</b>پرسش مصاحبه
        </span>
        <span>PDF · EPUB · نسخه چاپی</span>
      </div>

      <div className="sc-tags">
        <span>React 19.2</span>
        <span>TypeScript</span>
        <span>Vite 8</span>
        <span>React Compiler</span>
        <span>Server Components</span>
      </div>

      <div className="sc-author">
        <img src={asset("/author.webp")} alt="" width={62} height={62} />
        <div className="txt">
          <div className="n">محمدرضا رضائیان</div>
          <div className="r">Front-End Developer</div>
        </div>
      </div>
      <div className="sc-url">github.com/rezaian-dev/react-19-persian-guide</div>

      <div className="sc-win">
        <div className="sc-window">
          <div className="sc-win-head">
            <span className="d r" />
            <span className="d y" />
            <span className="d g" />
            <span className="fn">src/features/checkout/CheckoutForm.tsx</span>
          </div>
          <pre>
            <span className="k">import</span> {"{ useActionState, useOptimistic } "}<span className="k">from</span> <span className="s">'react'</span>;{"\n"}
            {"\n"}
            <span className="k">export function</span> <span className="f">CheckoutForm</span>({"{"} cart {"}"}: {"{"} cart: <span className="t">Cart</span> {"}"}) {"{"}{"\n"}
            {"  "}<span className="k">const</span> [state, submit, pending] ={"\n"}
            {"    "}<span className="f">useActionState</span>(placeOrder, <span className="c">null</span>);{"\n"}
            {"  "}<span className="k">const</span> [items, addOptimistic] ={"\n"}
            {"    "}<span className="f">useOptimistic</span>(cart.items);{"\n"}
            {"\n"}
            {"  "}<span className="k">return</span> ({"\n"}
            {"    "}&lt;<span className="tag">form</span> <span className="a">action</span>={"{"}submit{"}"}&gt;{"\n"}
            {"      "}&lt;<span className="tag">Suspense</span> <span className="a">fallback</span>={"{"}&lt;<span className="tag">Skeleton</span> /&gt;{"}"}&gt;{"\n"}
            {"        "}&lt;<span className="tag">CartSummary</span> <span className="a">items</span>={"{"}items{"}"} /&gt;{"\n"}
            {"      "}&lt;/<span className="tag">Suspense</span>&gt;{"\n"}
            {"      "}{"{"}state?.error && &lt;<span className="tag">p</span> <span className="a">role</span>=<span className="s">"alert"</span>&gt;{"{"}state.error{"}"}&lt;/<span className="tag">p</span>&gt;{"}"}{"\n"}
            {"      "}&lt;<span className="tag">SubmitButton</span> /&gt;   <span className="cm">{"// useFormStatus()"}</span>{"\n"}
            {"    "}&lt;/<span className="tag">form</span>&gt;{"\n"}
            {"  "});{"\n"}
            {"}"}
          </pre>
        </div>
      </div>
    </div>
  );
}
