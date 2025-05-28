import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Suggestion } from "./utils/schedulerUtils";

interface AvailabilitySuggestionsProps {
  proposalId: string;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  onBack: () => void;
}

export const AvailabilitySuggestions: React.FC<
  AvailabilitySuggestionsProps
> = ({ proposalId, onSelectSuggestion, onBack }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_suggestions")
        .select("*")
        .eq("proposal_id", proposalId)
        .order("score", { ascending: false });

      if (error) {
        console.error("Error fetching suggestions:", error);
        throw error;
      }
      setSuggestions(data || []);
      console.log("Suggestions", data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Group suggestions by date
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const date = suggestion.suggested_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(suggestion);
    return acc;
  }, {} as Record<string, Suggestion[]>);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={onBack} className="flex-row items-center">
            <Text className="text-blue-500 text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold">Available Time Slots</Text>
        </View>

        {Object.entries(groupedSuggestions).map(([date, dateSuggestions]) => (
          <View key={date} className="mb-6">
            <Text className="text-lg font-semibold mb-2">
              {format(new Date(date), "EEEE, MMMM d")}
            </Text>

            <View className="space-y-2">
              {dateSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={`${date}-${suggestion.suggested_start_time}`}
                  onPress={() => onSelectSuggestion(suggestion)}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-lg font-medium">
                        {format(
                          new Date(
                            `2000-01-01T${suggestion.suggested_start_time}`
                          ),
                          "h:mm a"
                        )}{" "}
                        -
                        {format(
                          new Date(
                            `2000-01-01T${suggestion.suggested_end_time}`
                          ),
                          "h:mm a"
                        )}
                      </Text>
                      <Text className="text-gray-600">
                        {suggestion.participant_count} participants available
                      </Text>
                    </View>
                    <View className="bg-blue-100 px-3 py-1 rounded-full">
                      <Text className="text-blue-800 font-medium">
                        Score: {suggestion.score}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
