export const REGIONS = [
  "head",
  "neck",
  "chest",
  "abdomen",
  "lower_abdomen",
  "left_shoulder",
  "right_shoulder",
  "left_upper_arm",
  "right_upper_arm",
  "left_forearm",
  "right_forearm",
  "hips",
  "lower_back",
  "left_thigh",
  "right_thigh",
  "left_knee",
  "right_knee",
  "left_lower_leg",
  "right_lower_leg",
  "left_foot",
  "right_foot",
];
export const regionLabel = (region: string) =>
  region.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const localDay = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const displayDate = (date: string) =>
  new Date(date.length === 10 ? `${date}T12:00:00` : date).toLocaleDateString(
    undefined,
    { day: "numeric", month: "short", year: "numeric" },
  );
