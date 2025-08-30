import { useTranslation } from "react-i18next";

export default function AboutUsPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("about_title")}</h1>
      <p>{t("about_text")}</p>
    </div>
  );
}
