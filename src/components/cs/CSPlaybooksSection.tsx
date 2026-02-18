import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Play, Eye, Clock, CheckCircle, ChevronRight, Star } from "lucide-react";
import { mockPlaybooks } from "./workspaceData";
import { mockWSCustomers } from "./workspaceData";
import type { Playbook, PlaybookStep } from "./types";

const categoryColors: Record<string, string> = {
  recovery: "bg-red-100 text-red-700",
  retention: "bg-blue-100 text-blue-700",
  onboarding: "bg-green-100 text-green-700",
  growth: "bg-purple-100 text-purple-700",
};

const categoryLabels: Record<string, string> = {
  recovery: "Recuperação",
  retention: "Retenção",
  onboarding: "Pós-Venda",
  growth: "Crescimento",
};

const CSPlaybooksSection = () => {
  const [executing, setExecuting] = useState<Playbook | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [previewing, setPreviewing] = useState<Playbook | null>(null);

  const startExecution = (pb: Playbook) => {
    setExecuting(pb);
    setCurrentStep(0);
    setSelectedCustomer("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockPlaybooks.map((pb) => (
          <Card key={pb.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base">{pb.name}</h3>
                  <Badge className={`text-[10px] mt-1 ${categoryColors[pb.category]}`}>{categoryLabels[pb.category]}</Badge>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>🎯 Trigger: <span className="text-foreground">{pb.trigger}</span></p>
                <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {pb.estimatedTime} &middot; {pb.stepsCount} etapas</p>
                <p className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Meta: {pb.successMetric}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" className="gap-1" onClick={() => startExecution(pb)}>
                  <Play className="h-3 w-3" /> Executar
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setPreviewing(pb)}>
                  <Eye className="h-3 w-3" /> Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewing} onOpenChange={() => setPreviewing(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {previewing && (
            <>
              <DialogHeader><DialogTitle>{previewing.name}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                {previewing.steps.map((step) => (
                  <div key={step.order} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{step.order}</div>
                    <div>
                      <p className="font-medium text-sm">{step.title}</p>
                      {step.content && <p className="text-xs text-muted-foreground">{step.content}</p>}
                      {step.fields && (
                        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          {step.fields.map((f, i) => <li key={i}>• {f.label} ({f.type}){f.required ? " *" : ""}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Execution Wizard */}
      <Dialog open={!!executing} onOpenChange={() => setExecuting(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {executing && (
            <>
              <DialogHeader><DialogTitle>{executing.name}</DialogTitle></DialogHeader>

              {/* Customer Selection */}
              {!selectedCustomer && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium">Selecione o cliente:</p>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger><SelectValue placeholder="Escolher cliente..." /></SelectTrigger>
                    <SelectContent>
                      {mockWSCustomers.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name} (HS: {c.healthScore})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedCustomer && (
                <div className="mt-4 space-y-4">
                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <Progress value={((currentStep + 1) / executing.steps.length) * 100} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground">{currentStep + 1}/{executing.steps.length}</span>
                  </div>

                  {/* Current Step */}
                  {(() => {
                    const step = executing.steps[currentStep];
                    return (
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">{step.order}</div>
                            <h4 className="font-semibold">{step.title}</h4>
                            <Badge variant="outline" className="text-[10px]">{step.type}</Badge>
                          </div>
                          {step.content && <p className="text-sm text-muted-foreground">{step.content}</p>}
                          {step.fields && (
                            <div className="space-y-3 mt-2">
                              {step.fields.map((field, i) => (
                                <div key={i}>
                                  <label className="text-sm font-medium">{field.label}{field.required && <span className="text-red-500"> *</span>}</label>
                                  {field.type === "textarea" && <Textarea className="mt-1" placeholder={field.label} />}
                                  {field.type === "text" && <Input className="mt-1" placeholder={field.label} />}
                                  {field.type === "select" && field.options && (
                                    <Select>
                                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                      <SelectContent>
                                        {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  {field.type === "rating" && (
                                    <div className="flex gap-1 mt-1">
                                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                        <button key={n} className="h-8 w-8 rounded border hover:bg-primary hover:text-white text-xs font-medium transition-colors">{n}</button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>Anterior</Button>
                    {currentStep < executing.steps.length - 1 ? (
                      <Button size="sm" className="gap-1" onClick={() => setCurrentStep(currentStep + 1)}>Próximo <ChevronRight className="h-3 w-3" /></Button>
                    ) : (
                      <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => setExecuting(null)}>
                        <CheckCircle className="h-3 w-3" /> Finalizar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CSPlaybooksSection;
