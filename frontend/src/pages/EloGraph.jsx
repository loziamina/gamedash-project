import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageWrapper from "../components/PageWrapper";
import { getEloHistory } from "../services/elo";

export default function EloGraph() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await getEloHistory();

    const formatted = res.map((item, index) => ({
      name: `Match ${index + 1}`,
      elo: item.elo,
    }));

    setData(formatted);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen p-6 text-white">
        <h1 className="mb-8 text-4xl text-cyan-400 drop-shadow-[0_0_20px_rgba(0,212,255,0.7)]">
          ELO Progression
        </h1>

        <div className="dashboard-card rounded-xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-cyan-500/20">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="elo"
                stroke="#00D4FF"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageWrapper>
  );
}
