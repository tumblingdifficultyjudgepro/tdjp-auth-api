import type { NavigationState, PartialState } from '@react-navigation/native';

let cached:
  | NavigationState
  | PartialState<NavigationState>
  | undefined;

export function getCachedNavState() {
  return cached;
}

export function setCachedNavState(
  state?: NavigationState | PartialState<NavigationState>
) {
  cached = state;
}
