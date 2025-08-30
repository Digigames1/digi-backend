import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer(){
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <section className="nl">
        <div className="container nl-inner">
          <div className="nl-title">{t("stay_updated")}</div>
          <div className="nl-sub">{t("newsletter_sub")}</div>
          <form className="nl-form" onSubmit={(e)=>e.preventDefault()}>
            <input placeholder={t("newsletter_placeholder")} type="email" required/>
            <button aria-label={t("subscribe")}>✉️</button>
          </form>
        </div>
      </section>

      <section className="container footer-grid">
        <div>
          <div className="f-brand">DigiGames</div>
          <p className="muted">{t("footer_tagline")}</p>
          <div className="soc">
            <a href="#" aria-label="X">𝕏</a><a href="#" aria-label="Instagram">◎</a><a href="#" aria-label="YouTube">►</a>
          </div>
        </div>
        <div>
          <div className="f-title">{t("quick_links")}</div>
          <nav className="f-list">
            <Link to="/browse">{t("browse_cards")}</Link>
            <Link to="/how-it-works">{t("how_it_works")}</Link>
            <Link to="/about">{t("about_us")}</Link>
            <Link to="/contact">{t("contact")}</Link>
          </nav>
        </div>
        <div>
          <div className="f-title">{t("categories")}</div>
          <nav className="f-list">
            <Link to="/gaming">{t("gaming")}</Link>
            <Link to="/streaming">{t("streaming")}</Link>
            <Link to="/shopping">{t("shopping")}</Link>
            <Link to="/music">{t("music")}</Link>
          </nav>
        </div>
        <div>
          <div className="f-title">{t("support")}</div>
          <nav className="f-list">
            <Link to="/help">{t("help_center")}</Link>
            <Link to="/privacy">{t("privacy_policy")}</Link>
            <Link to="/terms">{t("terms_of_service")}</Link>
            <Link to="/refunds">{t("refund_policy")}</Link>
          </nav>
        </div>
      </section>

      <div className="container f-copy">{t("copyright")}</div>
    </footer>
  );
}
