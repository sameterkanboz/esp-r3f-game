import { useEffect, useState } from "react";
import "./App.css";

interface Position {
  x: number;
  y: number;
}

const initialPosition: Position = { x: 8, y: 1 };

function App(): JSX.Element {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [bullets, setBullets] = useState<
    { x: number; y: number; dir: "left" | "right" }[]
  >([]);
  const [gold, setGold] = useState<Position[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [explosion, setExplosion] = useState<Position | null>(null);
  const [score, setScore] = useState<number>(0);

  const moveCharacter = (dir: "left" | "right"): void => {
    if (isJumping || gameOver) return;

    setPosition((prevPosition) => {
      const newPosition = { ...prevPosition };
      if (dir === "left" && newPosition.x > 0) {
        newPosition.x -= 1;
        setDirection("left");
      }
      if (dir === "right" && newPosition.x < 15) {
        newPosition.x += 1;
        setDirection("right");
      }
      return newPosition;
    });
  };

  const jump = (): void => {
    if (isJumping || gameOver) return;

    setIsJumping(true);
    setPosition((prevPosition) => ({ ...prevPosition, y: 0 }));

    setTimeout(() => {
      setPosition((prevPosition) => ({ ...prevPosition, y: 1 }));
      setIsJumping(false);
    }, 500);
  };

  const sendMoveRequest = async (dir: string): Promise<void> => {
    await fetch("http://192.168.4.1/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `direction=${dir}`,
    });
  };

  const handleMove = (dir: "l" | "r" | "w"): void => {
    if (dir === "w") {
      jump();
    } else {
      moveCharacter(dir === "l" ? "left" : "right");
    }
    sendMoveRequest(dir);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "a") handleMove("l");
      if (event.key === "d") handleMove("r");
      if (event.key === "w") handleMove("w");
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBullets((prevBullets) =>
        prevBullets
          .map((bullet) => ({
            ...bullet,
            x: bullet.dir === "left" ? bullet.x - 1 : bullet.x + 1,
          }))
          .filter((bullet) => bullet.x >= 0 && bullet.x <= 15)
      );

      // Rastgele mermi ekleme
      if (Math.random() < 0.1) {
        const newBullet = {
          x: Math.random() < 0.5 ? 0 : 15,
          y: Math.random() < 0.5 ? 1 : 2,
          dir: Math.random() < 0.5 ? "right" : "left",
        };
        setBullets(
          (
            prevBullets: { x: number; y: number; dir: "left" | "right" }[] | any
          ) => [...prevBullets, newBullet]
        );
      }

      // Altın spawn etme
      if (Math.random() < 0.1) {
        const newGold = {
          x: Math.floor(Math.random() * 16),
          y: Math.random() < 0.5 ? 1 : 2,
        };
        setGold((prevGold) => [...prevGold, newGold]);
      }

      // Çarpışma kontrolü
      setBullets((prevBullets) => {
        for (const bullet of prevBullets) {
          if (bullet.x === position.x && bullet.y === position.y) {
            setGameOver(true);
            setExplosion({ x: position.x, y: position.y });
            return [];
          }
        }
        return prevBullets;
      });

      // Altın toplama
      setGold((prevGold) => {
        for (const g of prevGold) {
          if (g.x === position.x && g.y === position.y) {
            setScore((prevScore) => prevScore + 1);
            return prevGold.filter((gold) => gold !== g);
          }
        }
        return prevGold;
      });
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [position, gameOver]);

  return (
    <div className="flex flex-col items-center mt-12">
      {/* {gameOver && <div className="game-over">Game Over</div>}
      <div className="score">Score: {score}</div> */}
      <div className="grid">
        {Array.from({ length: 3 }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex">
            {Array.from({ length: 16 }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={`w-16 h-16 relative`}
                style={{
                  backgroundImage: `url('${
                    rowIndex === 0
                      ? "cloud.jpg"
                      : rowIndex === 1
                      ? ""
                      : "dirt.png"
                  }')`,
                  backgroundColor: `${
                    rowIndex === 1 ? "#5DEBF9" : rowIndex === 0 ? "#5DEBF9" : ""
                  }`,
                  backgroundSize:
                    rowIndex === 0 ? "cover" : rowIndex === 2 ? "cover" : "",
                  backgroundPosition:
                    rowIndex === 0
                      ? "center"
                      : rowIndex === 2
                      ? "right 6em bottom 10px"
                      : "",
                  zIndex: rowIndex === 0 ? 0 : rowIndex === 2 ? 1 : 0,
                }}
              >
                {explosion &&
                explosion.x === colIndex &&
                explosion.y === rowIndex ? (
                  <div
                    className="absolute inset-0 bg-explosion"
                    style={{
                      zIndex: 3,
                      backgroundImage: "url('explosion.gif')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ) : (
                  position.x === colIndex &&
                  position.y === rowIndex && (
                    <div
                      className="absolute inset-0 bg-hero"
                      style={{
                        zIndex: 2,
                        inset: `${isJumping ? "-50px 0 0 0" : "0"}`,
                        backgroundImage: `url('${
                          direction === "left"
                            ? "player-left.png"
                            : "player.png"
                        }')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        transition: "inset 0.5s",
                      }}
                    />
                  )
                )}
                {bullets.map(
                  (bullet, index) =>
                    bullet.x === colIndex &&
                    bullet.y === rowIndex &&
                    rowIndex !== 2 && (
                      <div
                        key={index}
                        className="absolute inset-0"
                        style={{
                          zIndex: 4,
                          backgroundImage: `url('${
                            bullet.dir === "left"
                              ? "bullet-left.png"
                              : "bullet.png"
                          }')`,
                          backgroundSize: "contain",
                          backgroundPosition: "center",
                          width: "100%",
                          height: "100%",
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    )
                )}
                {gold.map(
                  (g, index) =>
                    g.x === colIndex &&
                    g.y === rowIndex &&
                    rowIndex !== 2 && (
                      <div
                        key={index}
                        className="absolute inset-0"
                        style={{
                          zIndex: 3,
                          backgroundImage:
                            "url('https://media.giphy.com/media/ie22ZfuaW35JnAlLXU/giphy.gif')",
                          backgroundSize: "contain",
                          backgroundPosition: "center",
                          width: "100%",
                          height: "100%",
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    )
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center h-16 bg-white text-black relative shadow-sm font-mono">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
          play
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          onClick={() => {
            setGameOver(true);
            setScore(0);
            setPosition(initialPosition);
            setBullets([]);
            setGold([]);
          }}
        >
          restart
        </button>
      </div>
    </div>
  );
}

export default App;
