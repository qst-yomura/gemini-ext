import './App.css'
import { useState } from 'react'

function App() {
  const [selectedMode, setSelectedMode] = useState<string>(() => {
    return localStorage.getItem('translationMode') || 'keigo'
  })
  // const sessionRef = useRef<Rewriter>(null);
  // const [availability, setAvailability] = useState<boolean>(false);
  // const agentGen = useCallback(
  //   async (prompt: string) => {
  //     const isRewriterAvailable = 'Rewriter' in self;
  //     console.log("isRewriterAvailable:", isRewriterAvailable);
  //     if (!isRewriterAvailable) return;
  //     const availability: Availability = await Rewriter.availability();
  //     console.log(availability);
  //     if (availability == "available") {
  //       if (sessionRef.current === null)
  //         console.log("sessionRef is null");
  //         sessionRef.current = await Rewriter.create({
  //           expectedInputLanguages: ["ja"],
  //           outputLanguage: "ja",
  //       });
  //       console.log("creat sessionRef");
  //       const answer = sessionRef.current.rewrite(prompt, {context: "お嬢様の口調で書き換えて。"});
  //         // ストリームからチャンクを読み取る
  //       console.log(answer);
  //       answer.then((res) => { console.log(res) })
  //       .catch((err) => { console.error(err) });
  //     } else if(availability == "downloadable") {
  //         sessionRef.current = await Rewriter.create({
  //         monitor(m) {
  //           m.addEventListener("downloadprogress", e => {
  //             console.log(`Downloaded ${e.loaded * 100}%`);
  //           });
  //         }
  //       });
  //     }
  //   }
  // ,[]);

  // const onkeydownHandler = useCallback(
  //   ({
  //     currentTarget: { value },
  //     ctrlKey,
  //     metaKey,
  //     code,
  //   }: KeyboardEvent<HTMLTextAreaElement>) => {
  //     if ([ctrlKey, metaKey].includes(true) && code === "Enter") {

  //       void agentGen(value);
  //     }
  //   },
  //   [agentGen]
  // );


  const isRewriterAvailable = 'Rewriter' in self;
  const availabilityMessage = isRewriterAvailable ? "対応しています!" : "対応していません!";

  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = event.target.value
    console.log("Selected mode:", newMode)
    setSelectedMode(newMode);
    localStorage.setItem('translationMode', newMode);
  }
  return (
    <main className='w-xl'>
      <h1>
        ほんやくくん
      </h1>
      {
        !isRewriterAvailable ? (
          <p className='text-red-500'>{availabilityMessage}</p>
        ) : (
          <>
          {/* {availability?(<p>使える</p>):(<p>使えない</p>)} */}
            <h2 className="text-2xl text-amber-700">
              変換したい言葉を選択してください
            </h2>
            <select
              name=""
              id=""
              className='border'
              value={selectedMode}
              onChange={handleModeChange}
            >
              <option value="yasashi">やんわり説明</option>
              <option value="ojosama">お嬢様</option>
              <option value="osaka">関西弁</option>
              <option value="tsundere">ツンデレ</option>
            </select>

          </>
        )
      }
    </main>
  )
}

export default App
