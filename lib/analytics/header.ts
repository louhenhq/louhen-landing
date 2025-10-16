import { track } from '@/lib/clientAnalytics';
import type {
  AnalyticsEventPropsMap,
  HeaderAnalyticsMode,
  HeaderSurface,
} from '@/lib/analytics.schema';
import type { HeaderUserState } from '@shared/auth/user-state';
import type { SupportedLocale } from '@/next-intl.locales';

type HeaderEventName =
  | 'header_brand_click'
  | 'header_nav_click'
  | 'header_cta_click'
  | 'header_locale_switch'
  | 'header_theme_toggle'
  | 'header_consent_open'
  | 'header_open_drawer'
  | 'header_close_drawer'
  | 'header_ribbon_view'
  | 'header_ribbon_click'
  | 'header_ribbon_dismiss';

export type HeaderEventContext = {
  locale: SupportedLocale;
  mode: HeaderAnalyticsMode;
  userState: HeaderUserState;
};

type HeaderEventDetail<E extends HeaderEventName> = Omit<
  AnalyticsEventPropsMap[E],
  'locale' | 'mode' | 'surface' | 'user_state'
>;

const EVENT_SURFACE: Record<HeaderEventName, HeaderSurface> = {
  header_brand_click: 'header',
  header_nav_click: 'header',
  header_cta_click: 'header',
  header_locale_switch: 'header',
  header_theme_toggle: 'header',
  header_consent_open: 'header',
  header_open_drawer: 'drawer',
  header_close_drawer: 'drawer',
  header_ribbon_view: 'ribbon',
  header_ribbon_click: 'ribbon',
  header_ribbon_dismiss: 'ribbon',
};

type RecordHeaderEventOptions = {
  surface?: HeaderSurface;
};

export function recordHeaderEvent<E extends HeaderEventName>(
  event: E,
  context: HeaderEventContext,
  detail?: HeaderEventDetail<E>,
  options?: RecordHeaderEventOptions
) {
  const surface = options?.surface ?? EVENT_SURFACE[event];
  const eventDetail = (detail ?? {}) as HeaderEventDetail<E>;

  const props = {
    ...eventDetail,
    locale: context.locale,
    mode: context.mode,
    surface,
    'user_state': context.userState,
  };

  void track(event, props as AnalyticsEventPropsMap[E]);
}
