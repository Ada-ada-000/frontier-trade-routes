"use client";

import Link from "next/link";
import { localizePath } from "../../lib/i18n";
import { TopNav } from "../../components/top-nav";

export default function HomePageZh() {
  return (
    <div className="landing-page">
      <TopNav compact locale="zh" />

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <p className="eyebrow">EVE Frontier x Sui</p>
            <h1>Frontier Trade Routes</h1>
            <p className="landing-hero__lede">
              一个面向 EVE Frontier 的链上物流协作台，用模糊情报发现机会、发布航线任务，并通过质押与声誉来建立交易信任。
            </p>
            <div className="landing-actions">
              <Link href={localizePath("/app", "zh")} className="button primary">
                进入应用
              </Link>
              <Link href={localizePath("/opportunities", "zh")} className="button secondary">
                查看情报
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
