import React from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Formatador de valores
export const formatValue = (value, format) => {
  if (value === undefined || value === null) return '-';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
};

// Componente para exibir KPIs
export const KpiWidget = ({ widget }) => (
  <Card className="shadow-sm hover:shadow-md transition-all">
    <CardHeader className="pb-2">
      <CardTitle className="text-base flex justify-between items-center">
        {widget.title}
        <Badge 
          variant={widget.trendDirection === 'up' ? 'success' : 'destructive'} 
          className={widget.trendDirection === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
        >
          {widget.trend}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{formatValue(widget.value, widget.format)}</div>
    </CardContent>
  </Card>
);

// Componente para gráfico de barras
export const BarChartWidget = ({ widget, data }) => (
  <Card className="shadow-sm hover:shadow-md transition-all">
    <CardHeader>
      <CardTitle className="text-base">{widget.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data && data[0]?.value !== undefined && (
              <Bar 
                dataKey="value" 
                name="Valor" 
                fill={widget.colors?.[0] || "#4f46e5"} 
                radius={[4, 4, 0, 0]}
              />
            )}
            {data && data[0]?.horas !== undefined && (
              <Bar 
                dataKey="horas" 
                name="Horas" 
                fill={widget.colors?.[0] || "#4f46e5"} 
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

// Componente para gráfico de pizza
export const PieChartWidget = ({ widget, data }) => {
  const COLORS = widget.colors || ['#4f46e5', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="text-base">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para gráfico de linha
export const LineChartWidget = ({ widget, data }) => (
  <Card className="shadow-sm hover:shadow-md transition-all">
    <CardHeader>
      <CardTitle className="text-base">{widget.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data && data[0]?.tarefas !== undefined && (
              <Line 
                type="monotone" 
                dataKey="tarefas" 
                name="Tarefas"
                stroke={widget.colors?.[0] || "#4f46e5"} 
                activeDot={{ r: 8 }} 
              />
            )}
            {data && data[0]?.velocidade !== undefined && (
              <Line 
                type="monotone" 
                dataKey="velocidade" 
                name="Velocidade"
                stroke={widget.colors?.[0] || "#4f46e5"} 
                activeDot={{ r: 8 }} 
              />
            )}
            {data && data[0]?.orçado !== undefined && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="orçado" 
                  name="Orçado"
                  stroke="#4f46e5" 
                  strokeDasharray="5 5"
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="realizado" 
                  name="Realizado"
                  stroke="#ef4444" 
                  activeDot={{ r: 8 }} 
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

// Componente para gráfico de área
export const AreaChartWidget = ({ widget, data }) => (
  <Card className="shadow-sm hover:shadow-md transition-all">
    <CardHeader>
      <CardTitle className="text-base">{widget.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="tarefas" 
              name="Tarefas"
              stroke={widget.colors?.[0] || "#4f46e5"} 
              fill={widget.colors?.[0] || "#4f46e5"} 
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

// Componente para gráfico de dispersão
export const ScatterChartWidget = ({ widget, data }) => (
  <Card className="shadow-sm hover:shadow-md transition-all">
    <CardHeader>
      <CardTitle className="text-base">{widget.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="Estimado" />
            <YAxis type="number" dataKey="y" name="Realizado" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter 
              name="Tarefas" 
              data={data} 
              fill={widget.colors?.[0] || "#4f46e5"} 
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

// Componente para gráfico de radar
export const RadarChartWidget = ({ widget, data }) => (
  <Card className="shadow-sm hover:shadow-md transition-all">
    <CardHeader>
      <CardTitle className="text-base">{widget.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar 
              name="Projeto" 
              dataKey="A" 
              stroke={widget.colors?.[0] || "#4f46e5"} 
              fill={widget.colors?.[0] || "#4f46e5"} 
              fillOpacity={0.6} 
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

// Componente para um card simples de texto
export const TextWidget = ({ widget }) => (
  <Card className="shadow-sm hover:shadow-md transition-all">
    <CardHeader>
      <CardTitle className="text-base">{widget.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-700">{widget.content}</p>
    </CardContent>
  </Card>
);

// Renderizador de widgets baseado no tipo
export const WidgetRenderer = ({ widget, data }) => {
  switch (widget.type) {
    case 'kpi':
      return <KpiWidget widget={widget} />;
    case 'bar':
      return <BarChartWidget widget={widget} data={data} />;
    case 'pie':
      return <PieChartWidget widget={widget} data={data} />;
    case 'line':
      return <LineChartWidget widget={widget} data={data} />;
    case 'area':
      return <AreaChartWidget widget={widget} data={data} />;
    case 'scatter':
      return <ScatterChartWidget widget={widget} data={data} />;
    case 'radar':
      return <RadarChartWidget widget={widget} data={data} />;
    case 'text':
      return <TextWidget widget={widget} />;
    default:
      return (
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-base">Widget não suportado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Tipo de widget não reconhecido: {widget.type}</p>
          </CardContent>
        </Card>
      );
  }
};