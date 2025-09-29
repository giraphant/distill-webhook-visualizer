#!/usr/bin/env python3
"""
模拟发送Distill webhook数据的测试脚本
发送100组测试数据到本地webhook端点
"""

import requests
import json
import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Webhook endpoint
WEBHOOK_URL = "http://localhost:8000/webhook/distill"

# 模拟监控器配置
MONITORS = [
    {
        "monitor_id": "ecommerce_homepage",
        "monitor_name": "电商首页监控",
        "url": "https://shop.example.com",
        "base_value": 120.0
    },
    {
        "monitor_id": "api_health_check",
        "monitor_name": "API健康检查",
        "url": "https://api.example.com/health",
        "base_value": 85.0
    },
    {
        "monitor_id": "user_login_page",
        "monitor_name": "用户登录页面",
        "url": "https://app.example.com/login",
        "base_value": 95.0
    },
    {
        "monitor_id": "payment_gateway",
        "monitor_name": "支付网关监控",
        "url": "https://pay.example.com/status",
        "base_value": 150.0
    },
    {
        "monitor_id": "cdn_performance",
        "monitor_name": "CDN性能监控",
        "url": "https://cdn.example.com/test",
        "base_value": 45.0
    }
]

def generate_webhook_payload(monitor: Dict[str, Any], timestamp: datetime) -> Dict[str, Any]:
    """生成单个webhook负载数据"""

    # 生成有一定变化的值
    base_value = monitor["base_value"]
    variation = random.uniform(-30, 30)
    value = round(base_value + variation, 2)

    # 10%概率检测到变化
    is_change = random.random() < 0.1

    # 如果是变化，让变化更明显
    if is_change:
        change_magnitude = random.uniform(20, 50)
        if random.random() > 0.5:
            value += change_magnitude
        else:
            value -= change_magnitude
        value = round(max(0, value), 2)  # 确保不为负数

    status = "changed" if is_change else "unchanged"
    change_type = None
    if is_change:
        change_type = "increase" if value > base_value else "decrease"

    payload = {
        "monitor_id": monitor["monitor_id"],
        "monitor_name": monitor["monitor_name"],
        "url": monitor["url"],
        "value": value,
        "text_value": None,
        "status": status,
        "timestamp": timestamp.isoformat() + "Z",
        "is_change": is_change,
        "change_type": change_type,
        "previous_value": base_value if is_change else None
    }

    return payload

def send_webhook_batch(count: int = 100) -> List[Dict[str, Any]]:
    """发送一批webhook数据"""

    results = []
    base_time = datetime.utcnow() - timedelta(hours=24)  # 从24小时前开始

    print(f"🚀 开始发送 {count} 组webhook测试数据到 {WEBHOOK_URL}")
    print("=" * 60)

    for i in range(count):
        # 随机选择一个监控器
        monitor = random.choice(MONITORS)

        # 生成时间戳 (每个数据点间隔约15分钟)
        timestamp = base_time + timedelta(minutes=i * 15 + random.randint(-5, 5))

        # 生成webhook数据
        payload = generate_webhook_payload(monitor, timestamp)

        try:
            # 发送webhook请求
            response = requests.post(
                WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5
            )

            if response.status_code == 200:
                result = {
                    "index": i + 1,
                    "monitor": monitor["monitor_name"],
                    "value": payload["value"],
                    "is_change": payload["is_change"],
                    "status": "✅ 成功"
                }
                print(f"[{i+1:3d}/100] {monitor['monitor_name'][:20]:20} | 值: {payload['value']:7.2f} | {'🔄 变化' if payload['is_change'] else '⚪ 正常'} | ✅")
            else:
                result = {
                    "index": i + 1,
                    "monitor": monitor["monitor_name"],
                    "status": f"❌ 失败 ({response.status_code})"
                }
                print(f"[{i+1:3d}/100] {monitor['monitor_name'][:20]:20} | ❌ HTTP {response.status_code}")

            results.append(result)

            # 短暂延迟避免过快发送
            time.sleep(0.1)

        except requests.RequestException as e:
            result = {
                "index": i + 1,
                "monitor": monitor["monitor_name"],
                "status": f"❌ 连接错误: {str(e)}"
            }
            results.append(result)
            print(f"[{i+1:3d}/100] {monitor['monitor_name'][:20]:20} | ❌ 错误: {str(e)}")

    return results

def verify_data_received():
    """验证数据是否正确接收"""
    try:
        # 检查webhook状态
        status_response = requests.get("http://localhost:8000/webhook/status", timeout=5)
        if status_response.status_code == 200:
            status_data = status_response.json()
            print(f"\n📊 Webhook状态检查:")
            print(f"   总记录数: {status_data['statistics']['total_records']}")
            print(f"   监控器数量: {status_data['statistics']['unique_monitors']}")
            print(f"   最新记录: {status_data['statistics']['latest_record']}")

        # 检查监控器摘要
        monitors_response = requests.get("http://localhost:8000/api/monitors", timeout=5)
        if monitors_response.status_code == 200:
            monitors_data = monitors_response.json()
            print(f"\n📈 监控器摘要:")
            for monitor in monitors_data:
                print(f"   {monitor['monitor_name']}: {monitor['total_records']} 条记录, {monitor['change_count']} 次变化")

        return True

    except Exception as e:
        print(f"❌ 验证数据时出错: {str(e)}")
        return False

if __name__ == "__main__":
    print("🎯 Distill Webhook 模拟测试")
    print(f"⏰ 开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # 发送测试数据
    results = send_webhook_batch(100)

    # 统计结果
    successful = len([r for r in results if "✅" in r["status"]])
    failed = len(results) - successful

    print("=" * 60)
    print(f"📊 发送结果统计:")
    print(f"   成功: {successful}/100")
    print(f"   失败: {failed}/100")
    print(f"   成功率: {successful}%")

    if successful > 0:
        print("\n🔍 验证接收到的数据...")
        verify_data_received()

        print("\n🌐 测试完成！现在可以在浏览器中查看:")
        print(f"   前端界面: http://localhost:3000")
        print(f"   API文档: http://localhost:8000/docs")
        print(f"   Webhook状态: http://localhost:8000/webhook/status")
    else:
        print("\n❌ 所有webhook发送都失败了，请检查后端服务是否正在运行")