-- Create trigger for auto-generating ouvidoria protocolo
CREATE TRIGGER generate_ouvidoria_protocolo_trigger
BEFORE INSERT ON public.ouvidoria_manifestacoes
FOR EACH ROW
EXECUTE FUNCTION public.generate_ouvidoria_protocolo();