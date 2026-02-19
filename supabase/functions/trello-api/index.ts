import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRELLO_BASE = "https://api.trello.com/1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TRELLO_API_KEY");
    const token = Deno.env.get("TRELLO_TOKEN");
    console.log("TRELLO_API_KEY length:", apiKey?.length || 0);
    console.log("TRELLO_TOKEN length:", token?.length || 0);
    if (!apiKey || !token) {
      throw new Error("TRELLO_API_KEY ou TRELLO_TOKEN não configurados");
    }

    const { action, boardId, cardId, labelId, labelData } = await req.json();
    const auth = `key=${apiKey}&token=${token}`;

    // ── Action router ──
    switch (action) {
      case "get_boards": {
        const res = await fetch(`${TRELLO_BASE}/members/me/boards?${auth}&fields=name,desc,prefs,url,closed&filter=open`);
        if (!res.ok) throw new Error(`Trello API error: ${res.status}`);
        const boards = await res.json();
        return json({ success: true, boards });
      }

      case "get_board_data": {
        if (!boardId) throw new Error("boardId é obrigatório");
        // Fetch lists, cards, and labels in parallel
        const [listsRes, cardsRes, labelsRes] = await Promise.all([
          fetch(`${TRELLO_BASE}/boards/${boardId}/lists?${auth}&filter=open`),
          fetch(`${TRELLO_BASE}/boards/${boardId}/cards?${auth}&fields=name,desc,idList,labels,due,dueComplete,idMembers,badges,closed,pos&filter=open`),
          fetch(`${TRELLO_BASE}/boards/${boardId}/labels?${auth}`),
        ]);
        if (!listsRes.ok || !cardsRes.ok || !labelsRes.ok) throw new Error("Erro ao buscar dados do board");
        const [lists, cards, labels] = await Promise.all([listsRes.json(), cardsRes.json(), labelsRes.json()]);
        return json({ success: true, lists, cards, labels });
      }

      case "get_labels": {
        if (!boardId) throw new Error("boardId é obrigatório");
        const res = await fetch(`${TRELLO_BASE}/boards/${boardId}/labels?${auth}`);
        if (!res.ok) throw new Error(`Erro ao buscar labels: ${res.status}`);
        const labels = await res.json();
        return json({ success: true, labels });
      }

      case "create_label": {
        if (!boardId || !labelData) throw new Error("boardId e labelData são obrigatórios");
        const res = await fetch(`${TRELLO_BASE}/boards/${boardId}/labels?${auth}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: labelData.name, color: labelData.color }),
        });
        if (!res.ok) throw new Error(`Erro ao criar label: ${res.status}`);
        const label = await res.json();
        return json({ success: true, label });
      }

      case "update_label": {
        if (!labelId || !labelData) throw new Error("labelId e labelData são obrigatórios");
        const res = await fetch(`${TRELLO_BASE}/labels/${labelId}?${auth}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(labelData),
        });
        if (!res.ok) throw new Error(`Erro ao atualizar label: ${res.status}`);
        const label = await res.json();
        return json({ success: true, label });
      }

      case "delete_label": {
        if (!labelId) throw new Error("labelId é obrigatório");
        const res = await fetch(`${TRELLO_BASE}/labels/${labelId}?${auth}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Erro ao deletar label: ${res.status}`);
        return json({ success: true });
      }

      case "add_label_to_card": {
        if (!cardId || !labelId) throw new Error("cardId e labelId são obrigatórios");
        const res = await fetch(`${TRELLO_BASE}/cards/${cardId}/idLabels?${auth}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: labelId }),
        });
        if (!res.ok) throw new Error(`Erro ao adicionar label ao card: ${res.status}`);
        return json({ success: true });
      }

      case "remove_label_from_card": {
        if (!cardId || !labelId) throw new Error("cardId e labelId são obrigatórios");
        const res = await fetch(`${TRELLO_BASE}/cards/${cardId}/idLabels/${labelId}?${auth}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Erro ao remover label do card: ${res.status}`);
        return json({ success: true });
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  } catch (error) {
    console.error("trello-api error:", error);
    return json({ success: false, error: error.message }, 400);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
