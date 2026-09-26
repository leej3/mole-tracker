import * as ImagePicker from "expo-image-picker";

export async function pickPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error("Please allow access to your photo library.");
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
  });
  return !result.canceled && result.assets[0] ? result.assets[0].uri : null;
}
