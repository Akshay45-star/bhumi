/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/privacy-policy` | `/(auth)/signin` | `/(auth)/signup` | `/(auth)/terms` | `/(auth)/verify` | `/(onboarding)` | `/(onboarding)/how-it-works` | `/(onboarding)/permissions` | `/(onboarding)/story` | `/(onboarding)/welcome` | `/(onboarding)/what-is-bhumi` | `/(tabs)` | `/(tabs)/check-in` | `/(tabs)/home` | `/(tabs)/legacy` | `/(tabs)/messages` | `/(tabs)/settings` | `/(tabs)/vault` | `/_sitemap` | `/check-in` | `/home` | `/how-it-works` | `/legacy` | `/messages` | `/permissions` | `/privacy-policy` | `/settings` | `/signin` | `/signup` | `/story` | `/terms` | `/vault` | `/verify` | `/welcome` | `/what-is-bhumi`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
