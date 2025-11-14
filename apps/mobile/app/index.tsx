import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-900 mb-4">
        MatchDay Mobile
      </Text>
      <Text className="text-base text-gray-600 mb-8">
        Welcome to the mobile app!
      </Text>
      <Link href="/(auth)/login" className="bg-blue-600 px-6 py-3 rounded-lg">
        <Text className="text-white font-semibold">Get Started</Text>
      </Link>
    </View>
  );
}
