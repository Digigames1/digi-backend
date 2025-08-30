import { useTranslation } from "react-i18next";

export default function FAQPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("faq_title")}</h1>
      <p>{t("faq_text")}</p>
    </div>
  );
}
