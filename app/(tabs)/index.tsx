import { Funko, initDb, listFunkos } from "@/lib/db";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Button, Image, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useEffect } from "react";
import { Alert } from "react-native";

export default function HomeScreen() {
  const [items, setItems] = useState<Funko[]>([]);

  useFocusEffect(
    useCallback(() => {
      initDb();
      setItems(listFunkos());
    }, [])
  );

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <ThemedView style={{ alignItems: "center", marginTop: 40 }}>
        <ThemedText type="title">📦 Minha Coleção de Funkos</ThemedText>

        <ThemedView style={{ marginTop: 12, width: "100%" }}>
          <Button
            title="Cadastrar Funko"
            onPress={() => router.push("/cadastro")}
          />
        </ThemedView>

        <ThemedText style={{ marginTop: 16 }}>
          Itens cadastrados: {items.length}
        </ThemedText>

        {items.length === 0 ? (
          <ThemedText style={{ marginTop: 12, opacity: 0.8 }}>
            Ainda não tem nada aqui. Cadastra o primeiro e bora! 🚀
          </ThemedText>
        ) : (
          <ThemedView style={{ marginTop: 16, width: "100%" }}>
            {items.map((item) => (
              <Pressable
                key={String(item.id)}
                onPress={() =>
  router.push({
    pathname: "/funko/[id]",
    params: { id: String(item.id) },
  })
}
                style={{ marginBottom: 10 }}
              >
                <ThemedView
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#2a2a2a",
                  }}
                >
                  <ThemedView
                    style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
                  >
                    {item.fotoUri ? (
                      <Image
                        source={{ uri: item.fotoUri }}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "#2a2a2a",
                          backgroundColor: "#111",
                        }}
                      />
                    ) : (
                      <ThemedView
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "#2a2a2a",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#111",
                        }}
                      >
                        <ThemedText style={{ opacity: 0.8 }}>📷</ThemedText>
                      </ThemedView>
                    )}

                    <ThemedView style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
                        {item.nome} #{item.numero}
                      </ThemedText>

                      <ThemedText style={{ marginTop: 4, opacity: 0.8 }}>
                        {item.franquia ?? "—"} • {item.condicao ?? "sem condição"}
                      </ThemedText>

                      {!!item.observacoes && (
                        <ThemedText style={{ marginTop: 6, opacity: 0.8 }}>
                          {item.observacoes}
                        </ThemedText>
                      )}
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
        )}

        <ThemedText style={{ marginTop: 18, opacity: 0.8 }}>
          Seu app pessoal começou agora 🚀
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}
useEffect(() => {
  fetch("https://funko-colecao.vercel.app/api/health")
    .then(res => res.json())
    .then(data => {
      Alert.alert("API Response", JSON.stringify(data));
    })
    .catch(err => {
      Alert.alert("Erro", err.message);
    });
}, []);