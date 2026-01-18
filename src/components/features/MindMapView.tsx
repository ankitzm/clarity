import { useEffect, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
    type Node,
    type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { useMindMap } from '../../hooks/useMindMap';
import { Card } from '../ui';
import type { AnalysisResult } from '../../types';

interface MindMapViewProps {
    results: AnalysisResult[];
    conversationTitle: string;
}

// Define custom node types
const nodeTypes = {
    custom: CustomNode,
};

export function MindMapView({ results, conversationTitle }: MindMapViewProps) {
    const { mindMapData, isGenerating, error, generateMindMap } = useMindMap();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Generate mind map when component mounts or results change
    useEffect(() => {
        if (results.length > 0 && !mindMapData && !isGenerating) {
            generateMindMap(results, conversationTitle);
        }
    }, [results, conversationTitle, mindMapData, isGenerating, generateMindMap]);

    // Convert mind map data to ReactFlow nodes and edges
    useEffect(() => {
        if (mindMapData) {
            const reactFlowNodes: Node[] = mindMapData.nodes.map((node) => ({
                id: node.id,
                type: 'custom',
                position: node.position,
                data: {
                    label: node.label,
                    description: node.data.description,
                    icon: node.data.icon,
                    color: node.data.color,
                    nodeType: node.type,
                },
            }));

            const reactFlowEdges: Edge[] = mindMapData.edges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                animated: edge.animated || false,
                type: ConnectionLineType.SmoothStep,
                style: {
                    stroke: '#667eea',
                    strokeWidth: 2,
                },
                labelStyle: {
                    fontSize: 12,
                    fontWeight: 500,
                    fill: 'var(--color-text-secondary)',
                },
                labelBgStyle: {
                    fill: 'var(--color-surface)',
                    fillOpacity: 0.9,
                },
            }));

            setNodes(reactFlowNodes);
            setEdges(reactFlowEdges);
        }
    }, [mindMapData, setNodes, setEdges]);

    const onInit = useCallback((reactFlowInstance: any) => {
        // Fit view to show all nodes
        setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
        }, 100);
    }, []);

    // Loading state
    if (isGenerating) {
        return (
            <Card variant="outlined" padding="lg" className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-4 border-[--color-accent] border-t-transparent rounded-full animate-spin" />
                <h3 className="text-lg font-semibold text-[--color-text-primary] mb-2">
                    Generating Mind Map
                </h3>
                <p className="text-[--color-text-secondary]">
                    AI is creating a visual representation of your conversation...
                </p>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card variant="outlined" padding="lg" className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-[--color-text-primary] mb-2">
                    Failed to Generate Mind Map
                </h3>
                <p className="text-[--color-text-secondary] mb-4">{error}</p>
                <button
                    onClick={() => generateMindMap(results, conversationTitle)}
                    className="px-4 py-2 bg-[--color-accent] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    Try Again
                </button>
            </Card>
        );
    }

    // Empty state
    if (!mindMapData || nodes.length === 0) {
        return (
            <Card variant="outlined" padding="lg" className="text-center">
                <div className="text-4xl mb-4">🗺️</div>
                <h3 className="text-lg font-semibold text-[--color-text-primary] mb-2">
                    No Mind Map Data
                </h3>
                <p className="text-[--color-text-secondary]">
                    Unable to generate mind map from the analysis results.
                </p>
            </Card>
        );
    }

    return (
        <Card variant="default" padding="none" className="overflow-hidden">
            <div style={{ width: '100%', height: '700px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onInit={onInit}
                    nodeTypes={nodeTypes}
                    connectionLineType={ConnectionLineType.SmoothStep}
                    fitView
                    attributionPosition="bottom-left"
                    minZoom={0.2}
                    maxZoom={2}
                    defaultEdgeOptions={{
                        type: ConnectionLineType.SmoothStep,
                        animated: false,
                    }}
                >
                    <Background
                        color="var(--color-border)"
                        gap={16}
                        size={1}
                    />
                    <Controls
                        style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}
                    />
                    <MiniMap
                        nodeColor={(node) => {
                            const nodeType = (node.data as any)?.nodeType;
                            switch (nodeType) {
                                case 'central':
                                    return '#667eea';
                                case 'main':
                                    return '#f5576c';
                                case 'action':
                                    return '#4facfe';
                                case 'insight':
                                    return '#43e97b';
                                default:
                                    return '#e5e7eb';
                            }
                        }}
                        style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                        }}
                        maskColor="rgba(0, 0, 0, 0.1)"
                    />
                </ReactFlow>
            </div>
        </Card>
    );
}
