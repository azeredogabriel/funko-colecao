import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getFunkoById,
  initDb,
  insertFunko,
  updateFunko,
} from "@/lib/db";

export default function CadastroScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = useMemo(() => (params.id ? Number(params.id) : null), [params.id]);

  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [franquia, setFranquia] = useState("");
  const [condicao, setCondicao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // NOVO: loading do “buscar info”
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    initDb();

    if (editId) {
      const f = getFunkoById(editId);
      if (!f) return;

      setNome(f.nome ?? "");
      setNumero(f.numero ?? "");
      setFotoUri(f.fotoUri ?? null);
      setFranquia(f.franquia ?? "");
      setCondicao(f.condicao ?? "");
      setObservacoes(f.observacoes ?? "");
    }
  }, [editId]);

  const canSave = useMemo(() => {
    return nome.trim().length > 0 && numero.trim().length > 0;
  }, [nome, numero]);

  async function tirarFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "Preciso de acesso à câmera pra tirar a foto.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled) return;

    setFotoUri(result.assets[0].uri);
  }

  async function escolherDaGaleria() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "Preciso de acesso à galeria pra escolher a foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;

    setFotoUri(result.assets[0].uri);
  }

  // NOVO: buscar informações pela foto chamando a API no Vercel
  async function buscarInfoPelaFoto() {
    if (!fotoUri) {
      Alert.alert("Sem foto 😅", "Tira ou escolhe uma foto primeiro.");
      return;
    }

    // Se você criar EXPO_PUBLIC_API_URL no projeto, ele usa.
    // Senão, cai no seu deploy do Vercel.
    const API_BASE =
      process.env.EXPO_PUBLIC_API_URL || "https://funko-colecao.vercel.app";

    try {
      setLoadingAI(true);

      const form = new FormData();
      form.append("image", {
        uri: fotoUri,
        name: "funko.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(`${API_BASE}/api/identify-funko`, {
        method: "POST",
        body: form,
        // NÃO definir Content-Type manualmente em multipart no React Native
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert("Deu ruim na API 😬", data?.error || `Status ${res.status}`);
        return;
      }

      // Ajuste conforme o retorno real da sua API:
      if (data?.nome) setNome(String(data.nome));
      if (data?.numero) setNumero(String(data.numero));
      if (data?.franquia) setFranquia(String(data.franquia));
      if (data?.condicao) setCondicao(String(data.condicao));
      if (data?.observacoes) setObservacoes(String(data.observacoes));

      Alert.alert("Pronto! ✅", "Preenchi os campos com base na foto.");
    } catch (e: any) {
      Alert.alert("Erro 😵", e?.message || "Falha ao chamar a API.");
    } finally {
      setLoadingAI(false);
    }
  }

  function handleSalvar() {
    if (!canSave) {
      Alert.alert("Faltou coisa aí 😅", "Preencha pelo menos Nome e Número.");
      return;
    }

    const payload = {
      nome: nome.trim(),
      numero: numero.trim(),
      fotoUri: fotoUri ?? null,
      franquia: franquia.trim() || null,
      condicao: condicao.trim() || null,
      observacoes: observacoes.trim() || null,
    };

    if (editId) {
      updateFunko(editId, payload);
      Alert.alert("Atualizado! ✅", `Funko: ${payload.nome} (#${payload.numero})`);
      router.back();
      return;
    }

    insertFunko(payload);
    Alert.alert("Salvo! ✅", `Funko: ${payload.nome} (#${payload.numero})`);

    // limpa só quando é cadastro novo
    setNome("");
    setNumero("");
    setFotoUri(null);
    setFranquia("");
    setCondicao("");
    setObservacoes("");

    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{editId ? "Editar Funko" : "Cadastro de Funko"}</Text>
      <Text style={styles.subtitle}>Agora com foto: app com cara de produto 😎</Text>

      <View style={styles.form}>
        {/* Botões de foto */}
        <View style={styles.photoRow}>
          <Pressable onPress={tirarFoto} style={styles.photoButton}>
            <Text style={styles.photoButtonText}>Tirar foto</Text>
          </Pressable>

          <Pressable onPress={escolherDaGaleria} style={styles.photoButton}>
            <Text style={styles.photoButtonText}>Galeria</Text>
          </Pressable>

          {fotoUri && (
            <Pressable
              onPress={() => setFotoUri(null)}
              style={[styles.photoButton, styles.photoRemove]}
            >
              <Text style={styles.photoButtonText}>Remover</Text>
            </Pressable>
          )}
        </View>

        {/* NOVO: Botão buscar info */}
        <Pressable
          disabled={!fotoUri || loadingAI}
          onPress={buscarInfoPelaFoto}
          style={({ pressed }) => [
            styles.button,
            (!fotoUri || loadingAI) && styles.buttonDisabled,
            pressed && fotoUri && !loadingAI && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {loadingAI ? "Buscando..." : "Buscar info (pela foto)"}
          </Text>
        </Pressable>

        {/* Preview */}
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.noPhoto}>
            <Text style={styles.noPhotoText}>Sem foto ainda 📷</Text>
          </View>
        )}

        <Field label="Nome *" value={nome} onChangeText={setNome} placeholder="Ex: Spider-Man" />

        <Field
          label="Número *"
          value={numero}
          onChangeText={setNumero}
          placeholder="Ex: 03"
          keyboardType="numeric"
        />

        <Field label="Franquia" value={franquia} onChangeText={setFranquia} placeholder="Ex: Marvel" />
        <Field label="Condição" value={condicao} onChangeText={setCondicao} placeholder="Ex: Novo / Caixa ok" />

        <Field
          label="Observações"
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Ex: Chase, assinatura, onde comprei..."
          multiline
          numberOfLines={4}
        />

        <Pressable
          disabled={!canSave}
          onPress={handleSalvar}
          style={({ pressed }) => [
            styles.button,
            !canSave && styles.buttonDisabled,
            pressed && canSave && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>{editId ? "Salvar alterações" : "Salvar"}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Voltar</Text>
        </Pressable>

        <Text style={styles.hint}>* Campos obrigatórios</Text>
      </View>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#999"
        keyboardType={props.keyboardType ?? "default"}
        multiline={props.multiline}
        numberOfLines={props.numberOfLines}
        style={[styles.input, props.multiline && styles.inputMultiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0b0b0b" },
  title: { fontSize: 26, fontWeight: "900", color: "#fff", marginBottom: 6 },
  subtitle: { color: "#cfcfcf", opacity: 0.9, marginBottom: 12 },

  form: { gap: 12 },

  photoRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  photoButton: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#141414",
  },
  photoRemove: { backgroundColor: "#2a0f12", borderColor: "#5a1b22" },
  photoButtonText: { color: "#fff", fontWeight: "900" },

  photoPreview: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111",
  },
  noPhoto: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  noPhotoText: { color: "#cfcfcf", opacity: 0.85, fontSize: 16 },

  field: { gap: 6 },
  label: { color: "#eaeaea", opacity: 0.9 },

  input: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#fff",
  },
  inputMultiline: { minHeight: 90, textAlignVertical: "top" },

  button: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#141414",
  },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.5 },
  secondaryButton: { backgroundColor: "#101010" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  hint: { color: "#cfcfcf", opacity: 0.75, marginTop: 6 },
});