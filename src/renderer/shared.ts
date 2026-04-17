import { t, type TranslationKey } from "../common/i18n";
import type { SupportedLocale } from "../common/types";

export const applyStaticTranslations = (locale: SupportedLocale) => {
  document.documentElement.lang = locale;

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n as TranslationKey | undefined;
    if (!key) {
      return;
    }

    const message = t(locale, key);
    if (element.tagName === "TITLE") {
      document.title = message;
      return;
    }

    element.textContent = message;
  });

  document
    .querySelectorAll<HTMLElement>("[data-i18n-placeholder]")
    .forEach((element) => {
      const key = element.dataset.i18nPlaceholder as TranslationKey | undefined;
      if (!key || !("placeholder" in element)) {
        return;
      }

      (element as HTMLInputElement | HTMLTextAreaElement).placeholder = t(locale, key);
    });
};

export const truncateText = (value: string, maxLength = 220) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
