import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface VoiceSettings {
  name: string;
  gender: 'male' | 'female';
  voiceURI: string;
}

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [response, setResponse] = useState('');
  const [ripples, setRipples] = useState<number[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({
    name: 'Ассистент',
    gender: 'female',
    voiceURI: ''
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ru-RU';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTextInput(transcript);
        handleQuery(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast({
          title: "Ошибка распознавания",
          description: "Не удалось распознать речь. Попробуйте ещё раз.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const ruVoices = voices.filter(voice => voice.lang.includes('ru'));
      setAvailableVoices(ruVoices);
      if (ruVoices.length > 0 && !settings.voiceURI) {
        const femaleVoice = ruVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('женский'));
        setSettings(prev => ({
          ...prev,
          voiceURI: femaleVoice?.voiceURI || ruVoices[0].voiceURI
        }));
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setResponse('');
      triggerRipple();
      recognitionRef.current.start();
    } else {
      toast({
        title: "Не поддерживается",
        description: "Ваш браузер не поддерживает распознавание речи.",
        variant: "destructive"
      });
    }
  };

  const triggerRipple = () => {
    const id = Date.now();
    setRipples(prev => [...prev, id]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r !== id));
    }, 1000);
  };

  const handleQuery = async (query: string) => {
    if (!query.trim()) return;

    setResponse('Обрабатываю запрос...');

    const mockResponses = [
      `${settings.name} слушает вас. Вы спросили: "${query}". Я умный помощник и готов помочь!`,
      `Понял ваш запрос: "${query}". Могу помочь с поиском информации, управлением приложениями или ответить на вопросы.`,
      `Отлично! "${query}" - интересный вопрос. Для полноценной работы потребуется интеграция с ChatGPT API.`
    ];

    setTimeout(() => {
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      setResponse(randomResponse);
      speakResponse(randomResponse);
    }, 800);
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 1.0;
      utterance.pitch = settings.gender === 'female' ? 1.2 : 0.8;
      
      if (settings.voiceURI) {
        const voice = availableVoices.find(v => v.voiceURI === settings.voiceURI);
        if (voice) {
          utterance.voice = voice;
        }
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleQuery(textInput);
      triggerRipple();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-[#1e1b3a] to-background"></div>
      
      <div className="absolute inset-0 opacity-30">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl"
            style={{
              width: Math.random() * 300 + 50 + 'px',
              height: Math.random() * 300 + 50 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`
            }}
          />
        ))}
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 left-6 z-50 hover:bg-white/10 backdrop-blur-sm border border-white/10"
          >
            <Icon name="Settings" size={24} className="text-foreground" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="backdrop-blur-xl bg-card/95 border-white/10">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold">Настройки помощника</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg">Имя помощника</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Введите имя"
                className="bg-muted/50 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-lg">Пол</Label>
              <Select
                value={settings.gender}
                onValueChange={(value: 'male' | 'female') => setSettings(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger className="bg-muted/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Женский</SelectItem>
                  <SelectItem value="male">Мужской</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice" className="text-lg">Голос</Label>
              <Select
                value={settings.voiceURI}
                onValueChange={(value) => setSettings(prev => ({ ...prev, voiceURI: value }))}
              >
                <SelectTrigger className="bg-muted/50 border-white/10">
                  <SelectValue placeholder="Выберите голос" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 text-sm text-muted-foreground">
              <p>💡 Настройте параметры по вашему вкусу. Помощник запомнит ваши предпочтения.</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 max-w-4xl w-full">
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
            {settings.name}
          </h1>
          <p className="text-lg text-muted-foreground">Ваш умный голосовой помощник</p>
        </div>

        <div className="relative mb-16">
          <div className="relative">
            {ripples.map((id) => (
              <div
                key={id}
                className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ripple"
                style={{
                  width: '400px',
                  height: '400px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}

            <button
              onClick={startListening}
              disabled={isListening}
              className="relative w-64 h-64 rounded-full bg-gradient-to-br from-primary via-secondary to-accent shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all duration-300 hover:scale-105 disabled:opacity-70 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse-bubble"></div>
              
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/40 via-secondary/40 to-accent/40 backdrop-blur-xl border border-white/20"></div>
              
              <div className="relative z-10 flex items-center justify-center h-full">
                {isListening ? (
                  <div className="space-y-2">
                    <Icon name="Mic" size={80} className="text-white animate-pulse" />
                    <div className="flex gap-1 justify-center">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-8 bg-white rounded-full animate-pulse"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <Icon name="Mic" size={80} className="text-white group-hover:scale-110 transition-transform" />
                )}
              </div>
            </button>
          </div>
        </div>

        {response && (
          <div className="mb-8 p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10 max-w-2xl w-full animate-[fade-in_0.3s_ease-out]">
            <div className="flex items-start gap-3">
              <Icon name="MessageCircle" size={24} className="text-primary flex-shrink-0 mt-1" />
              <p className="text-lg leading-relaxed">{response}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleTextSubmit} className="w-full max-w-2xl">
          <div className="relative">
            <Input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Или напишите ваш вопрос здесь..."
              className="w-full h-14 pl-6 pr-14 text-lg rounded-full bg-card/40 backdrop-blur-xl border-white/10 focus:border-primary/50 transition-all"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </form>

        <div className="mt-8 flex gap-4 flex-wrap justify-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Icon name="Mic" size={16} className="text-primary" />
            <span>Голосовой ввод</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Type" size={16} className="text-secondary" />
            <span>Текстовый ввод</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Volume2" size={16} className="text-accent" />
            <span>Озвучивание ответов</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
