import { FileVideo, Upload } from "lucide-react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from '@ffmpeg/util'
import { api } from "@/lib/axios";


type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success' 

const statusMessages = {
    converting: 'Convertendo...',
    generating: 'Transcrevendo...',
    uploading: 'Carregando...',
    success: 'Sucesso!'
}

interface VideoInputFormProps {
    onVideoUploaded: (id:string) => void
}

export function VideoInputForm(props: VideoInputFormProps) {
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const promptInputRef = useRef<HTMLTextAreaElement>(null)
    const [status, setStatus] = useState<Status>('waiting')

    function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
        const { files } = event.currentTarget

        if(!files) {
            return
        }

        const selctedFiles = files[0]
        
        setVideoFile(selctedFiles)

    }


    async function convertVideoToAudio(video: File){
        console.log('Convert started.')

        const ffmpeg = await getFFmpeg() 

        await ffmpeg.writeFile('input.mp4', await fetchFile(video))

        /* ffmpeg.on('log', log => {
            console.log('log')
        }) */

        ffmpeg.on('progress', progress => {
            console.log('Convert progress: ' + Math.round(progress.progress * 100))
        })

        await ffmpeg.exec([
            '-i',
            'input.mp4',
            '-map',
            '0:a',
            '-b:a',
            '20k',
            '-acodec',
            'libmp3lame',
            'output.mp3'
        ])

        const data = await ffmpeg.readFile('output.mp3')

        const audioFileBlob = new Blob([data], {type: 'audio/mpeg'})
        const audioFile = new File([audioFileBlob], 'audio.mp3', {
            type: 'audio/mpeg'
        })

        console.log('Convert finished.')

        return audioFile
    }

    async function handleUploadVideo(event: FormEvent<HTMLFormElement>){
        event.preventDefault()

        const prompt = promptInputRef.current?.value

        if(!videoFile){
            return
        }

        setStatus('converting')

        const audioFile = await convertVideoToAudio(videoFile)

        const data = new FormData()

        data.append('file', audioFile)

        setStatus('uploading')
        const response = await api.post('/videos', data)

        const videoId = response.data.video.id

        setStatus('generating')
        await api.post(`/videos/${videoId}/transcription`, {
            prompt
        })

        setStatus('success')

        props.onVideoUploaded(videoId)
    }

    const previewUrl = useMemo(() => {
        if(!videoFile) {
            return null
        }

        return URL.createObjectURL(videoFile)
    }, [videoFile])

    return (
        <>
         <form onSubmit={handleUploadVideo} className="space-y-4">
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

            <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelected}/>

            

            <div className="space-y-1">
              <Label htmlFor="transcription_prompt">
                Prompt de transcrição
              </Label>
              <Textarea 
                disabled={status != 'waiting'}
                ref={promptInputRef}
                id="transcription_prompt" 
                className="leading-relaxed resize-none"
                placeholder="Incluas palavras-chave mencionadas no vídeo separadas por vírgula"
              />
              </div>

              <Button 
                data-success={status === 'success'}
                disabled={status !== 'waiting'} 
                type="submit" 
                className="w-full data-[success=true]:bg-emerald-700"
              >   
                {status === 'waiting' ? (
                    <>
                        Carregar vídeo
                        <Upload className="w-4 h-4 ml-2"/>
                    </>
                ) : statusMessages[status]}
              </Button> 
          </form>

        </>
    )
}