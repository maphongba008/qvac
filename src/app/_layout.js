import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Translation App",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </Stack>
  );
}
