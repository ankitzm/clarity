import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Panel,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
    type Node,
    type Edge,
} from 'reactflow';
import dagre from 'dagre';
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

// Layout configuration
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Set graph direction and spacing
    dagreGraph.setGraph({
        rankdir: 'LR',
        ranksep: 200,
        nodesep: 50
    });

    // Add nodes to graph
    nodes.forEach((node) => {
        // Adjust width/height based on node type
        let width = 200;
        let height = 100;

        switch (node.type) {
            case 'central': width = 300; height = 150; break;
            case 'main': width = 250; height = 120; break;
            default: width = 220; height = 100;
        }

        dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Add random slight offset to prevent perfectly straight lines which look unnatural
        const randomY = Math.random() * 20 - 10;

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - (nodeWithPosition.width / 2),
                y: nodeWithPosition.y - (nodeWithPosition.height / 2) + randomY,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

export function MindMapView({ results, conversationTitle }: MindMapViewProps) {
    const { mindMapData, isGenerating, error, generateMindMap } = useMindMap();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Generate mind map when component mounts or results change
    useEffect(() => {
        if (results.length > 0 && !mindMapData && !isGenerating) {
            generateMindMap(results, conversationTitle);
        }
    }, [results, conversationTitle, mindMapData, isGenerating, generateMindMap]);

    // Convert mind map data to ReactFlow nodes and edges with Layout
    useEffect(() => {
        if (mindMapData) {
            const initialNodes: Node[] = mindMapData.nodes.map((node) => ({
                id: node.id,
                type: 'custom',
                position: { x: 0, y: 0 }, // Initial position will be calculated by layout
                data: {
                    label: node.label,
                    description: node.data.description,
                    icon: node.data.icon,
                    color: node.data.color,
                    nodeType: node.type,
                },
            }));

            const initialEdges: Edge[] = mindMapData.edges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                animated: false,
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

            // Apply auto-layout
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                initialNodes,
                initialEdges
            );

            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
        }
    }, [mindMapData, setNodes, setEdges]);

    const onInit = useCallback((reactFlowInstance: any) => {
        // Fit view to show all nodes
        setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
        }, 100);
    }, []);

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    // Icons
    const MaximizeIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
    );

    const CloseIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );

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

    const flowContent = (
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
            <Panel position="top-right">
                <button
                    onClick={toggleFullScreen}
                    className="
                        p-2 rounded-lg 
                        bg-[--color-surface] 
                        border border-[--color-border] 
                        text-[--color-text-secondary]
                        hover:text-[--color-text-primary]
                        hover:bg-[--color-surface-elevated]
                        shadow-sm
                        transition-all duration-200
                        hover:scale-105
                        active:scale-95
                    "
                    title={isFullScreen ? "Close Fullscreen" : "Fullscreen"}
                >
                    {isFullScreen ? <CloseIcon /> : <MaximizeIcon />}
                </button>
            </Panel>
        </ReactFlow>
    );

    if (isFullScreen) {
        return createPortal(
            <div
                className="fixed inset-0 z-[9999]"
                style={{
                    backgroundColor: 'var(--color-background)',
                    width: '100vw',
                    height: '100vh',
                    animation: 'fadeIn 0.2s ease-out'
                }}
            >
                {flowContent}
            </div>,
            document.body
        );
    }

    return (
        <Card variant="default" padding="none" className="overflow-hidden">
            <div style={{ width: '100%', height: '700px' }}>
                {flowContent}
            </div>
        </Card>
    );
}
