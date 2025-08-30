import { useTranslation } from "react-i18next";

export default function ContactPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("contact_title")}</h1>
      <p>{t("contact_text")}</p>
    </div>
  );
}
