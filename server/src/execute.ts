import { spawn } from "child_process";

export const executeCpp = (code: string, input: string, timeLimitMs = 2000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const encodedInput = Buffer.from(input).toString("base64");

    const dockerProcess = spawn("docker", [
      "run",
      "--rm",
      "-i",
      "--network", "none",       
      "--memory", "256m",       
      "--cpus", "1.0",
      "gcc:latest",
      "sh",
      "-c",
      `cat > main.cpp && g++ main.cpp -O3 -o main && echo "${encodedInput}" | base64 -d > input.txt && ./main < input.txt`
    ]);

    let output = "";
    let errorOutput = "";

    // ⏱️ Timeout safeguard to prevent infinite loops
    const timer = setTimeout(() => {
      dockerProcess.kill("SIGKILL");
      reject(new Error("TIME_LIMIT_EXCEEDED"));
    }, timeLimitMs);

    dockerProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    dockerProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    dockerProcess.on("close", (exitCode) => {
      clearTimeout(timer); // Cancel the safety timer since it finished
      if (exitCode !== 0) {
        reject(new Error(errorOutput || "Execution failed"));
      } else {
        resolve(output.trim());
      }
    });

    dockerProcess.stdin.write(code);
    dockerProcess.stdin.end();
  });
};