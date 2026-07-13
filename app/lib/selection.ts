import { isPosition, LANE_LABELS, POSITIONS } from "./data";
import {
  DEFAULT_SELECTION,
  isQuestionTypeId,
  type QuizSelection,
} from "./questions";

/**
 * Parse ?lanes=TOP,MIDDLE&types=title,skill into a selection.
 * A missing / entirely-invalid param falls back to "everything selected".
 */
export function parseSelection(params: URLSearchParams): QuizSelection {
  const lanes = (params.get("lanes") ?? "").split(",").filter(isPosition);
  const types = (params.get("types") ?? "").split(",").filter(isQuestionTypeId);
  return {
    lanes: lanes.length > 0 ? lanes : [...DEFAULT_SELECTION.lanes],
    types: types.length > 0 ? types : [...DEFAULT_SELECTION.types],
  };
}

/** Build the query string for /quiz. Omits params that mean "all". */
export function selectionToSearch(selection: QuizSelection): string {
  const params = new URLSearchParams();
  if (
    selection.lanes.length > 0 &&
    selection.lanes.length < DEFAULT_SELECTION.lanes.length
  ) {
    // Keep the canonical lane order for stable URLs.
    params.set(
      "lanes",
      POSITIONS.filter((p) => selection.lanes.includes(p)).join(","),
    );
  }
  if (
    selection.types.length > 0 &&
    selection.types.length < DEFAULT_SELECTION.types.length
  ) {
    params.set(
      "types",
      DEFAULT_SELECTION.types
        .filter((t) => selection.types.includes(t))
        .join(","),
    );
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** "TOP・MID" for a subset of lanes; "" when every lane is selected. */
export function laneLabel(lanes: readonly string[]): string {
  const selected = POSITIONS.filter((p) => lanes.includes(p));
  if (selected.length === 0 || selected.length === POSITIONS.length) return "";
  return selected.map((p) => LANE_LABELS[p]).join("・");
}
