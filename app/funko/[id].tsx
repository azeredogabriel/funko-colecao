import { deleteFunko, getFunkoById, initDb } from "@/lib/db";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function FunkoDetalhe() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = useMemo(() => Number(params.id), [params.id]);

  useEffect(() => {
    initDb();
  }, []);

  const item = getFunkoById(id);

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Funko não encontrado 😅</Text>
        <Pressable onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  // ✅ A PARTIR DAQUI, item É GARANTIDO (nunca null)
  const safeItem = item;

  function confirmarExcluir() {
    Alert.alert(
      "Excluir Funko",
      `Tem certeza que quer excluir "${safeItem.nome} #${safeItem.numero}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            deleteFunko(safeItem.id);
            router.back();
          },
        },
      ]
    );
  }

  function irEditar() {
    // ✅ evita erro de tipagem do router (mesma ideia que fizemos na Home)
    router.push({
      pathname: "/cadastro",
      params: { id: String(safeItem.id) },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {safeItem.nome} #{safeItem.numero}
      </Text>

      {safeItem.fotoUri ? (
        <Image source={{ uri: safeItem.fotoUri }} style={styles.photo} />
      ) : (
        <View style={styles.noPhoto}>
          <Text style={styles.noPhotoText}>Sem foto 📷</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.line}>
          <Text style={styles.label}>Franquia: </Text>
          {safeItem.franquia ?? "—"}
        </Text>
        <Text style={styles.line}>
          <Text style={styles.label}>Condição: </Text>
          {safeItem.condicao ?? "—"}
        </Text>
        <Text style={styles.line}>
          <Text style={styles.label}>Observações: </Text>
          {safeItem.observacoes ?? "—"}
        </Text>
      </View>

      {/* 🔵 BOTÃO EDITAR */}
      <Pressable onPress={irEditar} style={styles.button}>
        <Text style={styles.buttonText}>Editar</Text>
      </Pressable>

      {/* 🔴 BOTÃO EXCLUIR */}
      <Pressable
        onPress={confirmarExcluir}
        style={[styles.button, styles.danger]}
      >
        <Text style={styles.buttonText}>Excluir</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.button}>
        <Text style={styles.buttonText}>Voltar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0b0b0b" },
  title: { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 12 },

  photo: {
    width: "100%",
    height: 280,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111",
    marginBottom: 12,
  },

  noPhoto: {
    width: "100%",
    height: 280,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  noPhotoText: { color: "#cfcfcf", opacity: 0.85, fontSize: 16 },

  card: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#121212",
    gap: 8,
    marginBottom: 14,
  },

  line: { color: "#fff" },
  label: { fontWeight: "900" },

  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#141414",
    marginBottom: 10,
  },

  danger: {
    backgroundColor: "#2a0f12",
    borderColor: "#5a1b22",
  },

  buttonText: { color: "#fff", fontWeight: "900" },
});