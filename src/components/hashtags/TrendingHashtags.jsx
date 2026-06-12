// components/hashtag/TrendingHashtags.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import '../../css/TrendingHashtags.css';

function TrendingHashtags({ onHashtagClick }) {
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTrendingHashtags();
    }, []);

    const fetchTrendingHashtags = async () => {
        try {
            const response = await api.get('/api/v1/posts/trending-hashtags?limit=10&days=7');
            setTrendingHashtags(response.data);
        } catch (error) {
            console.error('Error fetching trending hashtags:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHashtagClick = (hashtag) => {
        if (onHashtagClick) {
            onHashtagClick(hashtag);
        } else {
            navigate(`/hashtag/${hashtag}`);
        }
    };

    if (loading) {
        return (
            <div className="trending-hashtags">
                <div className="trending-header">
                    <h3>📈 Thịnh hành</h3>
                </div>
                <div className="loading-skeleton">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-item"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (trendingHashtags.length === 0) {
        return null;
    }

    return (
        <div className="trending-hashtags">
            <div className="trending-header">
                <h3>📈 Thịnh hành</h3>
                <span className="trending-badge">Hôm nay</span>
            </div>
            <div className="hashtags-list">
                {trendingHashtags.map((item, index) => (
                    <div
                        key={item.hashtag}
                        className="hashtag-item"
                        onClick={() => handleHashtagClick(item.hashtag)}
                    >
                        <div className="hashtag-rank">#{index + 1}</div>
                        <div className="hashtag-info">
                            <div className="hashtag-name">#{item.hashtag}</div>
                            <div className="hashtag-count">{item.count} bài viết</div>
                        </div>
                        <div className="hashtag-trend">
                            {item.count > 100 ? '🔥' : '📈'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TrendingHashtags;