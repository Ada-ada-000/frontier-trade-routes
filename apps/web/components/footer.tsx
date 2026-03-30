import { type AppLocale } from "../lib/i18n";

export function Footer({ locale = "en" }: { locale?: AppLocale }) {
  const copy =
    locale === "zh"
      ? {
          left: "Frontier Trade Routes",
          region: "仅展示区域级情报",
          exact: "精确坐标按权限限制显示",
        }
      : {
          left: "Frontier Trade Routes",
          region: "Region-only intelligence",
          exact: "Exact coordinates stay gated",
        };

  return (
    <footer className="app-footer">
      <div>
        <strong>{copy.left}</strong>
      </div>
      <div className="app-footer__meta">
        <span>{copy.region}</span>
        <span>{copy.exact}</span>
      </div>
    </footer>
  );
}
