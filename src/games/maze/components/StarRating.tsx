import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StarRatingProps {
  stars: number;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ stars, size = 30 }) => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((i) => (
        <Text
          key={i}
          style={[
            styles.star,
            { fontSize: size },
            i <= stars ? styles.filled : styles.empty,
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  star: {
    marginHorizontal: 4,
  },
  filled: {
    color: '#f1c40f',
  },
  empty: {
    color: '#7f8c8d',
  },
});

export default StarRating;
