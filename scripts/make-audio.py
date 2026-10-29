"""Render an original, seamless lo-fi electric-piano/rain loop. No external samples."""
import math,random,wave,struct,pathlib
rate=22050;duration=24;length=rate*duration;audio=[0.0]*length
def note(midi,start,seconds,amp,bass=False):
 f=440*2**((midi-69)/12)
 for j in range(int(seconds*rate)):
  t=j/rate;env=min(1,t/.018)*math.exp(-t*(1.9 if bass else 2.8))*min(1,(seconds-t)/.15)
  value=math.sin(2*math.pi*f*t)+.17*math.sin(2*math.pi*f*2*t)*math.exp(-t*4)+.06*math.sin(2*math.pi*f*3*t)
  audio[(int(start*rate)+j)%length]+=amp*env*value
chords=[[50,57,60,64],[46,53,57,60],[43,50,53,57],[45,52,55,59]]
melody=[74,77,76,72,69,74,72,71]
for bar in range(8):
 start=bar*3;c=chords[bar%4];note(c[0]-12,start,2.8,.11,True)
 for k,n in enumerate(c):note(n,start+.08+k*.025,2.9,.038)
 note(melody[bar],start+1.5,2,.026)
r=random.Random(9017);low=0
for i in range(length):
 noise=r.uniform(-1,1);low=.94*low+.06*noise
 audio[i]+=.008*low+.0015*noise
peak=max(abs(v) for v in audio);target=pathlib.Path(__file__).resolve().parents[1]/'assets/midnight.wav';target.parent.mkdir(exist_ok=True)
with wave.open(str(target),'wb') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate)
 w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v/peak))*.45*32767)) for v in audio))
print(target)
