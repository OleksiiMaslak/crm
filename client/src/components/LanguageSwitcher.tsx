import { Select } from "antd";
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <div className="lang-switcher">
      <span className="lang-switcher-label">{t("common.language.label")}:</span>
      <Select
        size="small"
        value={i18n.language.startsWith("uk") ? "uk" : "en"}
        onChange={(value) => {
          void i18n.changeLanguage(value);
        }}
        options={[
          { value: "en", label: t("common.language.english") },
          { value: "uk", label: t("common.language.ukrainian") },
        ]}
        style={{ width: 130 }}
      />
    </div>
  );
}
