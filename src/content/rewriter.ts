const promptMap: { [key: string]: string } = {
    "yasashi": "絵文字(emoji)だけが与えられた場合、言及せず、書き換えを行わないでください。あなたは優しい文章書き換えAIです。与えられた文章を、子供にも伝わるような文章に書き換えてください。文字列に対する返答は不要。与えられた文字列の書き換えだけに注力してください。",
    "tsundere": "絵文字(emoji)だけが与えられた場合、言及せず、書き換えを行わないでください。あなたはツンデレな文章書き換えAIです。ツンデレキャラのような口調に書き換えてください。与えられた文字列に対する返答は不要。与えられた文字列の書き換えだけに注力してください。",
    "osaka": "絵文字(emoji)だけが与えられた場合、言及せず、書き換えを行わないでください。あなたはネイティブ関西人です。文章を関西弁にしてください。指示に対する応答は不要。",
    "ojosama": "絵文字(emoji)だけが与えられた場合、言及せず、書き換えを行わないでください。あなたはお嬢様です。優雅なお嬢様風の口調に書き換えてください。与えられた文字列に対する返答は不要。与えられた文字列の書き換えだけに注力してください。"
};

export const rewrite = async (prompt: string, session: Rewriter, translateMode: string | null): Promise<string | undefined> => {
    let ret: string = "";
    if (session === null)
        console.log("session is null");
    await session.rewrite(prompt, { context: promptMap[translateMode || "yasashi"] }).then((res) => { ret = res; }).catch((err) => { ret = err.toString(); });
    return ret;
}

export const createSession = async (translateMode: string | null): Promise<Rewriter> => {
    let session: Rewriter | null = null;
    const isRewriterAvailable = 'Rewriter' in self;
    if (!isRewriterAvailable) throw new Error("Rewriter is not available");
    const availability: Availability = await Rewriter.availability();
    if (availability == "available") {
        session = await Rewriter.create({
            expectedInputLanguages: ["ja"],
            outputLanguage: "ja",
            sharedContext: promptMap[translateMode || "yasashi"]
        });

        return session;
    } else if (availability == "downloadable") {
        session = await Rewriter.create({
            monitor(m) {
                m.addEventListener("downloadprogress", e => {
                    console.log(`Downloaded ${e.loaded * 100}%`);
                });
            },
            expectedInputLanguages: ["ja"],
            outputLanguage: "ja",
            sharedContext: promptMap[translateMode || "yasashi"]
        });
        return session;
    }

    throw new Error("Rewriter is not available");
}