import { FileVideo, Upload } from "lucide-react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ChangeEvent, useMemo, useState } from "react";

export function VideoInputForm() {
    const [videoFile, setVideoFile] = useState<File | null>(null)


    function handleFileSelector(event: ChangeEvent<HTMLInputElement>) {
        const { files } = event.currentTarget

        if(!files) {
            return
        }

        const selctedFiles = files[0]
        
        setVideoFile(selctedFiles)

    }

    const previewUrl = useMemo(() => {
        if(!videoFile) {
            return null
        }

        return URL.createObjectURL(videoFile)
    }, [videoFile])

    return (
        <>
         <form className="space-y-4">
            <label 
              htmlFor="video" 
              className="relative border flex rounded-md aspect-[6/2] cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
            >
              
              {previewUrl ? (
                <video src={previewUrl} controls={false} className="pointer-events-none relative" />
              ) : (
                  <>  
                    <FileVideo className="w-4 h-4" />
                    Selecione um  video
                  </>
               )}
            </label>

            <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelector}/>

            

            <div className="space-y-1">
              <Label htmlFor="transcription_prompt">
                Prompt de transcrição
              </Label>
              <Textarea 
                id="transcription_prompt" 
                className="leading-relaxed resize-none"
                placeholder="Incluas palavras-chave mencionadas no vídeo separadas por vírgula"
              />
              </div>

              <Button type="submit" className="w-full">
                Carregar vídeo 
                <Upload className="w-4 h-4 ml-2"/>
              </Button> 
          </form>

        </>
    )
}