import { CloudPrediction, Function, UploadType, Value } from "fxnjs"
import Head from "next/head"
import { useState } from "react"
import styles from "../styles/Home.module.css"

// You can generate this here using any online JSON schema generator
const EDITING_SCHEMA = {
  $schema: "http://json-schema.org/draft-04/schema#",
  type: "object",
  properties: {
    brightness: { type: "number" },
    contrast: { type: "number" },
    hue_shift: { type: "number" },
    saturation: { type: "number" }
  },
  required: ["brightness", "contrast", "hue_shift", "saturation"]
}

export default function Home () {
  // State
  const [image, setImage] = useState<File>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, number>>(null);
  const [result, setResult] = useState<string>(null);
  // Define edit handler
  const edit = async () => {
    setLoading(true);
    const fxn = new Function({ accessKey: process.env.NEXT_PUBLIC_FXN_ACCESS_KEY });
    // Get the edit amounts
    const amountPrediction = await fxn.predictions.create({
      tag: "@yusuf/un2structured",
      inputs: {
        text: `Make changes that are in range [-1, 1]. ${prompt}`,
        schema: EDITING_SCHEMA
      }
    }) as CloudPrediction;
    const amounts = amountPrediction.results[0] as Record<string, number>;
    setAmounts(amounts);
    // Edit the image
    const imageUrl = await fxn.storage.upload({
      name: image.name,
      buffer: await image.arrayBuffer(),
      type: UploadType.Value
    });
    const editPrediction = await fxn.predictions.create({
      tag: process.env.NEXT_PUBLIC_EDIT_FXN_TAG,
      inputs: {
        image: { data: imageUrl, type: "image" },
        ...amounts
      }
    }) as CloudPrediction;
    const resultImage = editPrediction.results[0] as Value;
    setResult(resultImage.data);
    setLoading(false);
  };
  // Render
  return (
    <div className={styles.container}>
      <Head>
        <title>Intruct - Edit</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className={styles.title}>
          Instruct Edit
        </h1>

        <p className={styles.description}>
          Edit images with instructions, powered by <a href="https://github.com/fxnai/autofxn" target="_blank">autofxn</a>.<br/>
          Currently supports brightness, contrast, hue shift, and saturation controls.
        </p>

        {
          !image &&
          <div className="">
            <p>
              Upload an image:
            </p>
            <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} />
          </div>
        }

        {
          image &&
          <>
            <div className={styles["image-container"]}>
              <img src={URL.createObjectURL(image)} />
              {
                amounts &&
                <pre>
                  {JSON.stringify(amounts, null, 2)}
                </pre>
              }
              {
                result &&
                <img src={result} />
              }
            </div>

            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className={styles.prompt}
            />

            {
              !loading &&
              <button onClick={edit} className={styles["edit-button"]}>
                Edit
              </button>
            }
            {
              loading &&
              <p>
                Loading...
              </p>
            }
          </>
        }
      </main>

      <footer>
        <a href="https://fxn.ai" target="_blank" rel="noopener noreferrer">
          Powered by  <img src="https://fxn.ai/icon.png" alt="Function" className={styles.logo} /> Function AI.
        </a>
      </footer>

      <style jsx>{`
        main {
          padding: 0rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}