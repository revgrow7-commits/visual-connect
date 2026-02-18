import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PesquisaSatisfacao = () => {
  const { token } = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!token) { setError("Token inválido"); setLoading(false); return; }
      const { data, error: err } = await supabase
        .from("cs_tickets")
        .select("code, customer_name, job_title, job_code, survey_completed_at")
        .eq("survey_token", token)
        .maybeSingle();

      if (err || !data) {
        setError("Pesquisa não encontrada ou link inválido.");
      } else if (data.survey_completed_at) {
        setSubmitted(true);
        setTicket(data);
      } else {
        setTicket(data);
      }
      setLoading(false);
    };
    fetchTicket();
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Selecione uma nota de 1 a 5"); return; }
    setSubmitting(true);
    const { error: err } = await supabase
      .from("cs_tickets")
      .update({
        survey_rating: rating,
        survey_feedback: feedback.trim() || null,
        survey_would_recommend: wouldRecommend,
        survey_completed_at: new Date().toISOString(),
      })
      .eq("survey_token", token);

    if (err) {
      toast.error("Erro ao enviar pesquisa");
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Link Inválido</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-xl font-bold">Obrigado!</h2>
            <p className="text-muted-foreground">Sua avaliação foi registrada com sucesso. Agradecemos seu feedback!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            <img src="/images/logo-industria-full.png" alt="Logo" className="h-10 mx-auto" />
          </div>
          <CardTitle className="text-xl">Pesquisa de Satisfação</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Ticket <strong>{ticket?.code}</strong> — {ticket?.customer_name}
          </p>
          {ticket?.job_title && (
            <p className="text-xs text-muted-foreground">Job: #{ticket?.job_code} — {ticket?.job_title}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="text-center space-y-2">
            <Label className="text-sm font-medium">Como você avalia nosso atendimento?</Label>
            <div className="flex justify-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {rating === 1 && "Muito insatisfeito"}
              {rating === 2 && "Insatisfeito"}
              {rating === 3 && "Neutro"}
              {rating === 4 && "Satisfeito"}
              {rating === 5 && "Muito satisfeito"}
            </p>
          </div>

          {/* Would Recommend */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Você recomendaria nossos serviços?</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={wouldRecommend === true ? "default" : "outline"}
                size="sm"
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                👍 Sim
              </Button>
              <Button
                type="button"
                variant={wouldRecommend === false ? "destructive" : "outline"}
                size="sm"
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                👎 Não
              </Button>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Comentários adicionais (opcional)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              rows={3}
              maxLength={1000}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enviar Avaliação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PesquisaSatisfacao;
